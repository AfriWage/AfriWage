export const COMPANY_WALLET = 'GA4FWQ7RZ6K2...H9X2';

export const dashboardMetrics = [
  {
    label: 'Avg Settlement',
    value: '< 5s',
    change: 'Stellar',
    detail: 'From treasury approval to network confirmation',
  },
  {
    label: 'Success Rate',
    value: '99.2%',
    change: 'Testnet',
    detail: 'Last 30 days of payout attempts on testnet',
  },
];

export const payoutQueues = [
  {
    title: 'Today',
    amount: '$18,420',
    detail: '28 contractors waiting for disbursement',
  },
  {
    title: 'This Week',
    amount: '$71,000',
    detail: 'Payroll batches scheduled for Tue and Fri',
  },
  {
    title: 'At Risk',
    amount: '3 issues',
    detail: 'Missing wallet mapping or offramp preference',
  },
];

export const recentTransactions = [
  {
    id: '1',
    title: 'Weekly creative payroll',
    counterparty: 'Amina Yusuf',
    amount: '-1,850 USDC',
    status: 'Delivered',
    time: '09:42 WAT',
    hash: 'abc123',
  },
  {
    id: '2',
    title: 'Treasury top-up',
    counterparty: 'Corporate reserve',
    amount: '+25,000 USDC',
    status: 'Received',
    time: 'Yesterday',
    hash: 'def456',
  },
  {
    id: '3',
    title: 'Product sprint payroll',
    counterparty: 'Lerato Mbeki',
    amount: '-2,400 USDC',
    status: 'Pending review',
    time: 'Yesterday',
    hash: 'ghi789',
  },
  {
    id: '4',
    title: 'Contract design payout',
    counterparty: 'Kwame Owusu',
    amount: '-980 USDC',
    status: 'Delivered',
    time: 'Thu',
    hash: 'jkl012',
  },
];
