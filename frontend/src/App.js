import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import DPIStats from './components/DPIStats'; // Correct path to DPIStats component

// Add styles
const styles = {
  app: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "Arial, sans-serif"
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    padding: '10px 0',
    borderBottom: '1px solid #eee'
  },
  navLink: {
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background-color 0.3s'
  },
  navLinkActive: {
    backgroundColor: '#007bff',
    color: 'white'
  },
  stats: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: "Arial, sans-serif"
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '10px',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa'
  },
  statLabel: {
    color: '#666',
    marginBottom: '5px',
    fontSize: '0.9em'
  },
  statValue: {
    fontSize: '1.2em',
    fontWeight: 'bold'
  },
  success: {
    color: '#28a745'
  },
  error: {
    color: '#dc3545'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  connectionList: {
    display: 'grid',
    gap: '20px',
    marginTop: '20px'
  },
  connectionItem: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  connectionStatusSuccess: {
    color: '#28a745'
  },
  connectionStatusError: {
    color: '#dc3545'
  }
};

function App() {
  const [stats, setStats] = useState({
    queueStats: {
      data: null,
      loading: true,
      error: null
    },
    trafficStats: {
      data: null,
      loading: true,
      error: null
    },
    connectionStatus: {
      data: null,
      loading: true,
      error: null
    },
    dpiStats: {
      data: null,
      loading: true,
      error: null
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchStats();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const endpoints = [
      { url: 'http://localhost:5000/api/queue-stats', key: 'queueStats' },
      { url: 'http://localhost:5000/api/traffic-stats', key: 'trafficStats' },
      { url: 'http://localhost:5000/api/check-connections', key: 'connectionStatus' },
      { url: 'http://localhost:5000/api/dpi-stats', key: 'dpiStats' }
    ];
  
    const fetchWithRetry = async (endpoint, maxRetries = 3) => {
      let lastError = null;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const timeout = endpoint.key === 'dpiStats' ? 40000 : 10000;

          const response = await axios.get(endpoint.url, {
            timeout,
            headers: {
              'Content-Type': 'application/json'
            }
          });

          return { data: response.data };
        } catch (error) {
          lastError = error;
          if (attempt < maxRetries) await new Promise(r => setTimeout(r, 2000));
        }
      }
      throw lastError;
    };
  
    try {
      const results = await Promise.allSettled(
        endpoints.map(endpoint =>
          fetchWithRetry(endpoint, endpoint.key === 'dpiStats' ? 1 : 3)
        )
      );
    
      const newStats = endpoints.reduce((acc, endpoint, index) => {
        const result = results[index];
      
        if (result.status === 'fulfilled') {
          const res = result.value;
      
          acc[endpoint.key] = {
            data: res.data || {},
            status: 'success',
            loading: false,
            error: null
          };
        } else {
          acc[endpoint.key] = {
            data: null,
            status: 'error',
            loading: false,
            error: result.reason?.message || 'Failed to fetch'
          };
        }
      
        return acc;
      }, {});
          
      console.log("✅ Stats loaded:", newStats);
      setStats(newStats);
    } catch (err) {
      console.error("❌ Error in fetchStats():", err);
    }
    
  };
  

  return (
    <Router>
      <div className="App">
        <nav>
          <Link to="/">Home</Link>
          <Link to="/stats">Statistics</Link>
          <Link to="/connections">Connections</Link>
          <Link to="/dpi-stats">DPI Stats</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stats" element={<Stats stats={stats} />} />
          <Route path="/connections" element={<Connections stats={stats.connectionStatus} />} />
          <Route path="/dpi-stats" element={<DPIStats stats={stats.dpiStats} />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="home">
      <h1>SDN Monitoring Dashboard</h1>
      <p>Welcome to the SDN Monitoring System</p>
    </div>
  );
}

function Stats({ stats }) {
  console.log('Stats component received:', stats);
  
  if (!stats) {
    return (
      <div className="loading">
        <h2>Loading Network Statistics...</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '0';
    if (typeof num !== 'number') return num.toString();
    if (num === 0) return '0';
    return num.toLocaleString();
  };

  // Get the actual data values
  const queueStats = stats.queueStats?.data?.data || {};
  const trafficStats = stats.trafficStats?.data?.data || {};

  const queueStatus = stats.queueStats?.status || 'loading';
  const trafficStatus = stats.trafficStats?.status || 'loading';


  console.log('Queue stats:', queueStats);
  console.log('Traffic stats:', trafficStats);
  console.log('Queue status:', queueStatus);
  console.log('Traffic status:', trafficStatus);

  return (
    <div style={styles.stats}>
      <h2>Network Statistics</h2>
      
      {/* Queue Stats Card */}
      <div style={styles.statCard}>
        <h3>Queue Statistics</h3>
        <div style={styles.statGrid}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Status:</span>
            <span style={{ ...styles.statValue, ...styles[queueStatus === 'success' ? 'success' : 'error'] }}>
              {queueStatus}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Backlog:</span>
            <span style={styles.statValue}>{formatNumber(queueStats.backlog || 0)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Overlimits:</span>
            <span style={styles.statValue}>{formatNumber(queueStats.overlimits || 0)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Drops:</span>
            <span style={styles.statValue}>{formatNumber(queueStats.drops || 0)}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Congestion:</span>
            <span style={{ 
              ...styles.statValue,
              ...(queueStats.congestion_predicted === 1 ? {
                color: '#dc3545',
                fontWeight: 'bold'
              } : {
                color: '#28a745'
              })
            }}>
              {queueStats.congestion_predicted === 1 ? 'Yes 🚨' : 'No ✅'}
            </span>
          </div>
        </div>
        {queueStats.congestion_predicted === 1 && (
          <div style={{ 
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '15px',
            borderRadius: '4px',
            marginTop: '15px',
            fontSize: '1.1em',
            border: '1px solid #f5c6cb'
          }}>
            ⚠️ Network Congestion Alert! 
            <br />
            <small style={{ color: '#800000' }}>
              High traffic detected. System is taking corrective actions.
              Please monitor network performance closely.
            </small>
          </div>
        )}
      </div>

      {/* Traffic Stats Card */}
      <div style={styles.statCard}>
        <h3>Traffic Statistics</h3>
        <div style={styles.statGrid}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Status:</span>
            <span style={{ ...styles.statValue, ...styles[trafficStatus === 'success' ? 'success' : 'error'] }}>
              {trafficStatus}
            </span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Bandwidth:</span>
            <span style={styles.statValue}>
              {trafficStatus === 'error' ? 'Error fetching data' : 
               trafficStats.bandwidth !== undefined ? 
                 `${parseFloat(trafficStats.bandwidth).toLocaleString()} Mbps` : 
                 '0 Mbps'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Connections({ stats }) {
  if (!stats || stats.loading) {
    return <div style={styles.loading}><p>Loading...</p></div>;
  }

  const { status, data } = stats;

  if (status !== 'success') {
    return <div style={styles.loading}><p>❌ Connection status error.</p></div>;
  }

  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return <div style={styles.loading}><p>⚠️ No connection data available.</p></div>;
  }

  return (
    <div style={styles.stats}>
      <h2>Connection Status</h2>
      <div style={styles.connectionList}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} style={styles.connectionItem}>
            <h4>{key}</h4>
            <div style={styles.connectionStatus}>
              <strong>Status:</strong>
              <span style={val.status === 'success' ? styles.connectionStatusSuccess : styles.connectionStatusError}>
                {val.status}
              </span>
            </div>
            {val.message && (
              <div style={{ fontSize: '0.85em', color: '#666' }}>{val.message}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}








export default App;
