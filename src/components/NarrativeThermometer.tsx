import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { API_CONFIG } from '../config/api.config';
import './NarrativeThermometer.css';

interface TrendDataPoint {
  date: string; // MM-DD format
  topic: string;
  score: number;
}

interface FormattedDataPoint {
  date: string;
  [topic: string]: string | number;
}

// Ink colors for sepia theme
const TOPIC_COLORS: Record<string, string> = {
  ukraine: '#1e3a5f',      // Navy Blue
  gaza: '#2d5016',         // Forest Green
  trump: '#8b2e2e',        // Deep Red
  epstein: '#5d2d5d',      // Purple
  diseases: '#cc6b2e'      // Burnt Orange
};

const TOPIC_LABELS: Record<string, string> = {
  ukraine: 'Ukraine',
  gaza: 'Gaza',
  trump: 'Trump',
  epstein: 'Epstein',
  diseases: 'Diseases'
};

const NarrativeThermometer: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure proper URL construction
      const baseUrl = API_CONFIG.BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/api/trends`;
      
      console.log('[NarrativeThermometer] Fetching trends from:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch trends data: ${response.status} ${response.statusText}`);
      }

      const data: TrendDataPoint[] = await response.json();
      setTrendData(data);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trend data');
    } finally {
      setLoading(false);
    }
  };

  // Transform data for Recharts (group by date, with topic values)
  const formatDataForChart = (): FormattedDataPoint[] => {
    // Get all unique dates
    const dates = Array.from(new Set(trendData.map(d => d.date))).sort();
    
    // Get all unique topics
    const topics = Array.from(new Set(trendData.map(d => d.topic)));

    // Create data points for each date
    return dates.map(date => {
      const dataPoint: FormattedDataPoint = { date: formatDate(date) };
      
      // Add score for each topic on this date
      topics.forEach(topic => {
        const point = trendData.find(d => d.date === date && d.topic === topic);
        dataPoint[topic] = point ? point.score : 0;
      });

      return dataPoint;
    });
  };

  const formatDate = (dateStr: string): string => {
    // dateStr is already in MM-DD format from API
    return dateStr;
  };

  if (loading) {
    return (
      <div className="narrative-thermometer-container">
        <h3 className="thermometer-header">7-DAY PROPAGANDA TREND</h3>
        <div className="thermometer-loading">
          <div className="loading-spinner-small" />
          <span>LOADING...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="narrative-thermometer-container">
        <h3 className="thermometer-header">7-DAY PROPAGANDA TREND</h3>
        <div className="thermometer-error">
          <span>[ERROR] TREND DATA UNAVAILABLE</span>
          <p style={{ fontSize: '0.6875rem', marginTop: '0.5rem', color: '#4A4A4A', fontFamily: "'JetBrains Mono', monospace" }}>
            Historical data will appear here once briefing articles are saved.
          </p>
        </div>
      </div>
    );
  }

  const chartData = formatDataForChart();
  const topics = Array.from(new Set(trendData.map(d => d.topic)));

  // Don't render if no data
  if (chartData.length === 0) {
    return (
      <div className="narrative-thermometer-container">
        <h3 className="thermometer-header">7-DAY PROPAGANDA TREND</h3>
        <div className="thermometer-empty">
          <span>NO DATA AVAILABLE</span>
          <p style={{ fontSize: '0.6875rem', marginTop: '0.5rem', color: '#4A4A4A', fontFamily: "'JetBrains Mono', monospace" }}>
            Historical data will appear here once briefing articles are saved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="narrative-thermometer-container">
      <h3 className="thermometer-header">7-DAY PROPAGANDA TREND</h3>
      <div className="thermometer-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="0" stroke="rgba(26, 26, 26, 0.12)" />
            <XAxis 
              dataKey="date" 
              stroke="#1A1A1A"
              tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              style={{ 
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
            <YAxis 
              label={{ 
                value: 'RHETORICAL HEAT', 
                angle: -90, 
                position: 'insideLeft',
                style: { 
                  textAnchor: 'middle', 
                  fill: '#1A1A1A',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.08em'
                }
              }}
              stroke="#1A1A1A"
              tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
              style={{ 
                fontSize: '10px',
                fontFamily: "'JetBrains Mono', monospace"
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '2px solid #1A1A1A',
                borderRadius: '0',
                color: '#1A1A1A',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                boxShadow: '3px 3px 0px 0px #1A1A1A',
                padding: '10px 12px'
              }}
              labelStyle={{ 
                color: '#1A1A1A', 
                marginBottom: '8px',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              itemStyle={{
                color: '#4A4A4A',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '16px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#1A1A1A',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              iconType="plainline"
            />
            {topics.map(topic => (
              <Line
                key={topic}
                type="linear"
                dataKey={topic}
                name={TOPIC_LABELS[topic]?.toUpperCase() || topic.toUpperCase()}
                stroke={TOPIC_COLORS[topic] || '#1A1A1A'}
                strokeWidth={2}
                dot={false}
                activeDot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NarrativeThermometer;
