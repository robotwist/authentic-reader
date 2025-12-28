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
        <h3 className="thermometer-header">7-Day Propaganda Trend</h3>
        <div className="thermometer-loading">
          <div className="loading-spinner-small" />
          <span>Loading trend data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="narrative-thermometer-container">
        <h3 className="thermometer-header">7-Day Propaganda Trend</h3>
        <div className="thermometer-error">
          <span>⚠️ Trend data unavailable</span>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#5A5A5A' }}>
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
        <h3 className="thermometer-header">7-Day Propaganda Trend</h3>
        <div className="thermometer-empty">
          <span>No trend data available yet</span>
          <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#5A5A5A' }}>
            Historical data will appear here once briefing articles are saved over multiple days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="narrative-thermometer-container">
      <h3 className="thermometer-header">7-Day Propaganda Trend</h3>
      <div className="thermometer-chart">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 197, 185, 0.3)" />
            <XAxis 
              dataKey="date" 
              stroke="#8B7355"
              style={{ 
                fontSize: '12px',
                fontFamily: "'Lora', 'Charter', 'Georgia', serif"
              }}
            />
            <YAxis 
              label={{ 
                value: 'Rhetorical Heat', 
                angle: -90, 
                position: 'insideLeft',
                style: { 
                  textAnchor: 'middle', 
                  fill: '#5A5A5A',
                  fontFamily: "'Lora', 'Charter', 'Georgia', serif"
                }
              }}
              stroke="#8B7355"
              style={{ 
                fontSize: '12px',
                fontFamily: "'Lora', 'Charter', 'Georgia', serif"
              }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#F9F7F1',
                border: '1px solid #D4C5B9',
                borderRadius: '8px',
                color: '#2C2C2C',
                fontFamily: "'Lora', 'Charter', 'Georgia', serif"
              }}
              labelStyle={{ 
                color: '#2C2C2C', 
                marginBottom: '8px',
                fontFamily: "'Lora', 'Charter', 'Georgia', serif",
                fontWeight: 600
              }}
              itemStyle={{
                color: '#5A5A5A',
                fontFamily: "'Lora', 'Charter', 'Georgia', serif"
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '20px',
                fontFamily: "'Lora', 'Charter', 'Georgia', serif",
                color: '#2C2C2C'
              }}
              iconType="line"
            />
            {topics.map(topic => (
              <Line
                key={topic}
                type="monotone"
                dataKey={topic}
                name={TOPIC_LABELS[topic] || topic}
                stroke={TOPIC_COLORS[topic] || '#5A5A5A'}
                strokeWidth={2}
                dot={{ r: 4, fill: TOPIC_COLORS[topic] || '#5A5A5A' }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default NarrativeThermometer;
