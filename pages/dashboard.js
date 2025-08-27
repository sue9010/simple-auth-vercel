import Head from 'next/head';
import Layout from '../components/Layout';
import styles from '../styles/Dashboard.module.css';

// Mock Data - Replace with actual data from your API
const stats = [
  { title: 'Total Revenue', value: '$54,390', change: '+5.2%', icon: '💰', color: '#28a745' },
  { title: 'New Orders', value: '1,280', change: '+12.8%', icon: '📦', color: '#17a2b8' },
  { title: 'Pending Shipments', value: '89', change: '-2.1%', icon: '🚚', color: '#ffc107' },
  { title: 'New Customers', value: '45', change: '+8.0%', icon: '👥', color: '#007bff' },
];

const recentActivities = [
  { user: 'John Doe', action: 'placed a new order', time: '2m ago', icon: '🛒' },
  { user: 'Jane Smith', action: 'updated customer profile', time: '15m ago', icon: '👤' },
  { user: 'System', action: 'generated monthly sales report', time: '1h ago', icon: '📄' },
  { user: 'Mike Johnson', action: 'shipped order #12345', time: '3h ago', icon: '✅' },
  { user: 'Sarah Brown', action: 'cancelled an order', time: '5h ago', icon: '❌' },
];

const DashboardPage = () => {
  return (
    <Layout>
      <Head>
        <title>ERP Dashboard</title>
      </Head>
      <div className={styles.dashboard}>
        <header className={styles.header}>
          <h1>Dashboard</h1>
        </header>

        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <div className={styles.statIcon} style={{ backgroundColor: stat.color }}>
                {stat.icon}
              </div>
              <div className={styles.statInfo}>
                <h3>{stat.title}</h3>
                <p>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.dashboardGrid}>
          <div className={styles.chartContainer}>
            <h2>Sales Overview</h2>
            <div className={styles.chartPlaceholder}>
              [Chart will be displayed here]
            </div>
          </div>
          <div className={styles.activityFeed}>
            <h2>Recent Activity</h2>
            <ul className={styles.activityList}>
              {recentActivities.map((activity, index) => (
                <li key={index} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{activity.icon}</div>
                  <div className={styles.activityText}>
                    <strong>{activity.user}</strong> {activity.action}
                    <span>{activity.time}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;