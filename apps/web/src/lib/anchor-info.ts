export interface AnchorInfoResponse {
  transferServer?: string;
  signingKey?: string;
  networkPassphrase?: string;
}

let anchorInfoPromise: Promise<AnchorInfoResponse> | null = null;

/**
 * Fetches the Yellow Card anchor info once per session and caches the resolved
 * result so repeated off-ramp interactions reuse the same request instead of
 * hitting the anchor on every mount. A failed request is not cached, so a
 * later interaction retries instead of being poisoned for the whole session.
 */
export function getAnchorInfoOnce(): Promise<AnchorInfoResponse> {
  if (!anchorInfoPromise) {
    anchorInfoPromise = fetch('/api/anchor/yellowcard?action=info')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to fetch anchor configuration');
        }

        return (await response.json()) as AnchorInfoResponse;
      })
      .catch((error: unknown) => {
        anchorInfoPromise = null;
        throw error;
      });
  }

  return anchorInfoPromise;
}
