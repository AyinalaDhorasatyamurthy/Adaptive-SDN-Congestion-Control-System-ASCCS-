import React from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const StyledCard = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  alignItems: 'center',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}));

const generateChartData = (data, type) => {
  if (type === 'protocol') {
    return {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEEAD'
        ]
      }]
    };
  } else if (type === 'application') {
    return {
      labels: data.map(item => item.name),
      datasets: [{
        data: data.map(item => item.count),
        backgroundColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEEAD'
        ]
      }]
    };
  } else {
    return null;
  }
};

const DPIChart = ({ upload, download, protocols, applications, type }) => {
  const chartData = type === 'protocol' 
    ? generateChartData(protocols, 'protocol')
    : type === 'application'
    ? generateChartData(applications, 'application')
    : null;

  return (
    <StyledCard>
      {type === 'protocol' || type === 'application' ? (
        <Box sx={{ width: '100%', height: 300 }}>
          {chartData && (
            <Doughnut 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          )}
        </Box>
      ) : (
        <Box sx={{ width: '100%', height: 300 }}>
          <Typography variant="h6" gutterBottom>
            Bandwidth Usage (Mbps)
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Box>
              <Typography variant="h4" color="primary">
                {download}
              </Typography>
              <Typography variant="subtitle1">Download</Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="secondary">
                {upload}
              </Typography>
              <Typography variant="subtitle1">Upload</Typography>
            </Box>
          </Box>
        </Box>
      )}
    </StyledCard>
  );
};

export default DPIChart;
