# Admin Dashboard - Quick Start Guide

## Getting Started

### Accessing the Dashboard

1. Navigate to `/admin` in your browser
2. If not authenticated, you'll be redirected to `/admin/login`
3. After login, you'll see the main admin dashboard layout

### Main Pages

#### 📊 Dashboard Overview (`/admin/dashboard`)
**Best for**: Getting a complete picture of platform activity

- View 4 key metrics: Users, Balance, Active Trades, Net Performance
- See profit/loss trends on a interactive chart
- Check top 5 traders leaderboard
- Auto-refreshes every 30 seconds
- Click "Refresh" button for manual update

**Pro Tip**: Use the overview to quickly spot anomalies in trading activity or user growth.

---

#### 👥 User Management (`/admin/users`)
**Best for**: Managing user accounts and monitoring user activity

- Search users by name or ID
- Filter by account type (Real/Demo)
- View detailed user profiles
- See real-time online status
- Export user list as CSV
- Auto-refresh every 30 seconds

**Features**:
- Click any user to see their profile panel
- Sort by name, type, balance, or status
- Paginate through large user lists
- View balance history sparklines

**Pro Tip**: Monitor new users (marked with "NEW" badge) for suspicious activity.

---

#### 💰 Transaction History (`/admin/transactions`)
**Best for**: Auditing financial movements and deposits/withdrawals

- View all transactions in detail
- Filter by: Type (Deposit/Withdrawal), Status, Date Range
- See summary stats: Total Deposits, Total Withdrawals, Net Volume
- Export transaction data to CSV
- Search by transaction ID or user

**Key Metrics**:
- Total Deposits: Sum of all deposits
- Total Withdrawals: Sum of all withdrawals
- Net Volume: Combined transaction volume
- Transaction Count: Total transactions in period

**Pro Tip**: Use date filters to analyze weekly/monthly transaction trends.

---

#### ⚡ Trading Activity (`/admin/trading`)
**Best for**: Real-time monitoring of trade execution

- Watch live trading activity (5-second auto-refresh)
- View trade metrics: Total Trades, Win Rate, Avg Stake, P&L
- Filter by: Market, Status, Trade ID
- Search for specific trades
- Monitor active positions

**Metrics Breakdown**:
- **Total Trades**: All trades in the current view
- **Active Trades**: Open/pending positions
- **Win Rate**: Percentage of profitable trades
- **Avg Stake**: Average bet size
- **Net P&L**: Combined profit/loss

**Pro Tip**: High win rates (>60%) on certain markets may indicate algorithmic advantage.

---

#### 🏥 System Health (`/admin/health`)
**Best for**: Monitoring system performance and receiving alerts

- Check status of 5 critical services
- View uptime percentage
- Monitor response times
- Track active connections
- Review system alerts and events

**Critical Services Monitored**:
1. API Connection
2. Database
3. Auth Service
4. WebSocket
5. Message Queue

**Alert Levels**:
- 🔵 **Info**: Informational events (backups, maintenance)
- 🟡 **Warning**: Performance issues or resource warnings
- 🔴 **Error**: Critical service failures

**Pro Tip**: Set up Slack notifications in Settings for real-time alerts.

---

#### ⚙️ System Configuration (`/admin/settings-config`)
**Best for**: Fine-tuning platform parameters and rules

**Configurable Areas**:

1. **Trading Parameters**
   - Min/Max stake amounts
   - Account balance limits
   - Prevents extreme trades

2. **Risk Management**
   - Daily loss limits per user
   - Hourly loss limits
   - Protects user funds

3. **Feature Toggles**
   - Enable/disable auto-trading
   - Enable/disable strategies
   - Toggle maintenance mode

4. **Notifications**
   - Email notifications
   - Slack integration (with webhook URL)

**Best Practice**: Always test changes with a few users before full rollout.

---

## Common Tasks

### Task 1: Monitor Peak Trading Hours
1. Go to Dashboard Overview
2. Note the time period
3. Switch to Trading Activity
4. Filter by status "Open" to see live trades
5. Check win rates on different markets

### Task 2: Investigate Suspicious User Activity
1. Go to User Management
2. Search for user ID
3. Click to open profile panel
4. Review recent trades in user detail
5. Check last seen timestamp
6. Export trades if needed for further analysis

### Task 3: Audit Financial Transactions
1. Go to Transaction History
2. Set date range to desired period
3. Apply type filter (Deposits/Withdrawals)
4. Export to CSV for accounting/compliance
5. Review status distribution

### Task 4: Check System Health Before Deployment
1. Go to System Health
2. Click "Check Now" for immediate status
3. Review critical services
4. Check uptime percentage
5. Review recent alerts
6. Only deploy if all services are "Operational"

### Task 5: Adjust Trading Parameters
1. Go to Settings
2. Update stake limits if needed
3. Review current loss limits
4. Update notification settings
5. Click "Save Settings"
6. Confirm save message appears

---

## Dashboard Statistics

### Understanding the Numbers

**Dashboard KPIs**:
- **Total Users**: All registered accounts (Real + Demo)
- **Online Users**: Currently active users
- **Total Balance**: Combined account balances
- **Active Trades**: Trades currently being executed
- **Net Performance**: Total profit/loss across all trades

**Trading Metrics**:
- **Win Rate**: Trades won ÷ Total trades × 100
- **Avg Stake**: Total stake ÷ Number of trades
- **P&L**: Profit and Loss (positive = profit, negative = loss)

**Transaction Stats**:
- **Total Deposits**: Money flowing in
- **Total Withdrawals**: Money flowing out
- **Net Volume**: Deposits - Withdrawals

---

## Performance Tips

### For Faster Dashboard Loading
1. Use specific date ranges instead of "All Time"
2. Filter data before viewing (e.g., by account type)
3. Close extra browser tabs
4. Clear browser cache if experiencing lag

### For Better System Performance
1. Monitor CPU/memory usage in System Health
2. Review alert logs for bottlenecks
3. Reduce auto-refresh frequency if needed
4. Archive old data periodically

---

## Troubleshooting

### Dashboard Not Loading?
- Check your internet connection
- Verify you're logged in to admin
- Try refreshing the page (F5)
- Clear browser cache (Ctrl+Shift+Delete)

### Data Not Updating?
- Check if auto-refresh is enabled
- Click "Refresh" button manually
- Verify API endpoints are responding
- Check System Health for service issues

### Can't Export Data?
- Ensure browser allows downloads
- Check file size (may take longer for large exports)
- Try a smaller date range
- Check browser console for errors

### Search Not Working?
- Verify search term is correct
- Try partial matches
- Clear filters and try again
- Reload the page

---

## Security Best Practices

1. **Never share your admin login credentials**
2. **Log out when leaving your computer**
3. **Use strong passwords (16+ characters)**
4. **Enable 2FA if available**
5. **Review audit logs regularly**
6. **Use VPN if accessing remotely**
7. **Report suspicious activity immediately**

---

## Keyboard Shortcuts

- **Ctrl+K** or **Cmd+K**: Open quick command menu
- **Escape**: Close modals/menus
- **Arrow Keys**: Navigate in command menu

---

## Need Help?

### Documentation
- See `ADMIN_DASHBOARD_GUIDE.md` for technical details
- Check component documentation in code comments
- Review API endpoint specifications

### Support
- Contact: [support email/channel]
- Escalate critical issues immediately
- Include screenshots when reporting bugs
- Provide specific time and user IDs for investigations

---

## Next Steps

1. ✅ Explore each dashboard page
2. ✅ Set up your notification preferences
3. ✅ Create admin alerts for critical thresholds
4. ✅ Set up regular audit schedules
5. ✅ Document any custom workflows

Happy monitoring! 🚀
