import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Divider,
  Table,
  Button,
  Alert,
  Select,
  Spin,
  Space,
  Tag,
  Row,
  Col,
  Statistic,
  Collapse,
  Progress,
  Pagination,
  Empty
} from 'antd';
import { 
  ExpandAltOutlined, 
  BookOutlined,
  PieChartOutlined,
  BarChartOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { chromaService } from '../services/chromaService';
import { trainingService } from '../utils/trainingService';
import { logger } from '../utils/logger';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;

// Feedback type definitions
interface FeedbackItem {
  articleId: string;
  analysisType: string;
  originalPrediction: any;
  userFeedback: {
    isCorrect: boolean | null;
    rating: number | null;
    comment?: string;
  };
  timestamp: number;
}

interface FeedbackStats {
  totalFeedback: number;
  ratingAverage: number;
  correctPercentage: number;
  incorrectPercentage: number;
  neutralPercentage: number;
  analysisCounts: Record<string, number>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BDB'];

interface TrainingMetrics {
  task: string;
  initialAccuracy: number;
  finalAccuracy: number;
  improvement: number;
  trainingDate: number;
}

const FeedbackDashboard: React.FC = () => {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [stats, setStats] = useState<FeedbackStats>({
    totalFeedback: 0,
    ratingAverage: 0,
    correctPercentage: 0,
    incorrectPercentage: 0,
    neutralPercentage: 0,
    analysisCounts: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState(1); // Ant Design uses 1-based pagination
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [trainingTask, setTrainingTask] = useState<string>('fallacy');
  const [isModelTraining, setIsModelTraining] = useState<boolean>(false);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics[]>([]);

  // Load feedback data
  useEffect(() => {
    const loadFeedback = async () => {
      setIsLoading(true);
      try {
        // For demo, we'll load from localStorage as fallback if ChromaDB is unavailable
        const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
        setFeedbackItems(localFeedback);
        calculateStats(localFeedback);
      } catch (error) {
        logger.error('Error loading feedback data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeedback();
  }, []);

  // Calculate statistics from feedback data
  const calculateStats = (items: FeedbackItem[]) => {
    if (!items.length) {
      return;
    }

    const totalItems = items.length;
    
    // Count feedback by analysis type
    const analysisCounts: Record<string, number> = {};
    items.forEach(item => {
      if (!analysisCounts[item.analysisType]) {
        analysisCounts[item.analysisType] = 0;
      }
      analysisCounts[item.analysisType]++;
    });
    
    // Calculate rating average
    const ratings = items
      .filter(item => item.userFeedback.rating !== null)
      .map(item => item.userFeedback.rating as number);
    
    const ratingAverage = ratings.length > 0 
      ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length 
      : 0;
    
    // Calculate correctness percentages
    const correct = items.filter(item => item.userFeedback.isCorrect === true).length;
    const incorrect = items.filter(item => item.userFeedback.isCorrect === false).length;
    const neutral = items.filter(item => item.userFeedback.isCorrect === null).length;
    
    setStats({
      totalFeedback: totalItems,
      ratingAverage: parseFloat(ratingAverage.toFixed(1)),
      correctPercentage: parseFloat(((correct / totalItems) * 100).toFixed(1)),
      incorrectPercentage: parseFloat(((incorrect / totalItems) * 100).toFixed(1)),
      neutralPercentage: parseFloat(((neutral / totalItems) * 100).toFixed(1)),
      analysisCounts
    });
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Prepare chart data
  const accuracyData = [
    { name: 'Correct', value: stats.correctPercentage },
    { name: 'Incorrect', value: stats.incorrectPercentage },
    { name: 'Neutral/Skip', value: stats.neutralPercentage }
  ];

  const analysisTypeData = Object.entries(stats.analysisCounts).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    count: value
  }));
  
  // Handle pagination
  const handleChangePage = (newPage: number, pageSize: number) => {
    setPage(newPage);
    setRowsPerPage(pageSize);
  };

  // Load training metrics
  useEffect(() => {
    setTrainingMetrics(trainingService.getTrainingMetrics());
  }, [isModelTraining]);
  
  // Handle training task selection change
  const handleTrainingTaskChange = (value: string) => {
    setTrainingTask(value);
  };
  
  // Start model training
  const startModelTraining = async () => {
    setIsModelTraining(true);
    setTrainingStatus('Training in progress...');
    
    try {
      const success = await trainingService.trainModel(trainingTask);
      
      if (success) {
        setTrainingStatus('Training completed successfully!');
        // Update metrics after training
        setTrainingMetrics(trainingService.getTrainingMetrics());
      } else {
        setTrainingStatus('Training failed. Not enough data or other error.');
      }
    } catch (error) {
      logger.error('Error during model training:', error);
      setTrainingStatus('An error occurred during training.');
    } finally {
      setIsModelTraining(false);
    }
  };

  // Define table columns for feedback items
  const columns = [
    {
      title: 'Analysis Type',
      dataIndex: 'analysisType',
      key: 'analysisType',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Correct?',
      dataIndex: ['userFeedback', 'isCorrect'],
      key: 'isCorrect',
      render: (isCorrect: boolean | null) => {
        if (isCorrect === true) return <Tag color="green">Yes</Tag>;
        if (isCorrect === false) return <Tag color="red">No</Tag>;
        return <Tag color="default">N/A</Tag>;
      }
    },
    {
      title: 'Rating',
      dataIndex: ['userFeedback', 'rating'],
      key: 'rating',
      render: (rating: number | null) => rating !== null ? `${rating}/5` : 'N/A'
    },
    {
      title: 'Comment',
      dataIndex: ['userFeedback', 'comment'],
      key: 'comment',
      render: (comment?: string) => comment || 'No comment'
    },
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => formatDate(timestamp)
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Feedback Dashboard</Title>
      <Paragraph type="secondary">
        View and analyze user feedback on content analysis
      </Paragraph>

      <Divider />

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Loading feedback data...</div>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Total Feedback" 
                  value={stats.totalFeedback} 
                  prefix={<PieChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Average Rating" 
                  value={stats.ratingAverage} 
                  suffix="/5" 
                  precision={1} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Correctness Rate" 
                  value={stats.correctPercentage} 
                  suffix="%" 
                  valueStyle={{ color: '#3f8600' }} 
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic 
                  title="Incorrectness Rate" 
                  value={stats.incorrectPercentage} 
                  suffix="%" 
                  valueStyle={{ color: '#cf1322' }} 
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card title="Accuracy Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={accuracyData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {accuracyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Analysis Type Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={analysisTypeData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>

          {/* Feedback Items Table */}
          <Card title="Recent Feedback" style={{ marginBottom: 24 }}>
            <Table 
              dataSource={feedbackItems.slice((page - 1) * rowsPerPage, page * rowsPerPage)} 
              columns={columns} 
              rowKey={(record) => `${record.articleId}-${record.timestamp}`}
              pagination={false}
            />
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <Pagination
                current={page}
                pageSize={rowsPerPage}
                total={feedbackItems.length}
                onChange={handleChangePage}
                showSizeChanger
              />
            </div>
          </Card>

          {/* Model Training Section */}
          <Collapse style={{ marginBottom: 24 }}>
            <Panel 
              header={
                <Space>
                  <BookOutlined />
                  <span>Model Training & Improvement</span>
                </Space>
              } 
              key="1"
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="Train Model with Feedback">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Text>Select analysis type to train:</Text>
                      <Select
                        style={{ width: 200 }}
                        value={trainingTask}
                        onChange={handleTrainingTaskChange}
                        disabled={isModelTraining}
                      >
                        <Option value="fallacy">Fallacy Detection</Option>
                        <Option value="sentiment">Sentiment Analysis</Option>
                        <Option value="summary">Summary Generation</Option>
                      </Select>
                      
                      <Button 
                        type="primary" 
                        onClick={startModelTraining}
                        loading={isModelTraining}
                        icon={<SyncOutlined />}
                        style={{ marginTop: 16 }}
                      >
                        {isModelTraining ? "Training..." : "Start Training"}
                      </Button>
                      
                      {trainingStatus && (
                        <Alert
                          message={trainingStatus}
                          type={trainingStatus.includes('completed') ? 'success' : 
                                trainingStatus.includes('failed') || trainingStatus.includes('error') ? 'error' : 'info'}
                          style={{ marginTop: 16 }}
                        />
                      )}
                      
                      {isModelTraining && (
                        <Progress percent={65} status="active" style={{ marginTop: 16 }} />
                      )}
                    </Space>
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card title="Training History">
                    {trainingMetrics.length > 0 ? (
                      <Table
                        dataSource={trainingMetrics}
                        pagination={false}
                        columns={[
                          {
                            title: 'Task',
                            dataIndex: 'task',
                            key: 'task'
                          },
                          {
                            title: 'Initial Accuracy',
                            dataIndex: 'initialAccuracy',
                            key: 'initialAccuracy',
                            render: (val: number) => `${(val * 100).toFixed(1)}%`
                          },
                          {
                            title: 'Final Accuracy',
                            dataIndex: 'finalAccuracy',
                            key: 'finalAccuracy',
                            render: (val: number) => `${(val * 100).toFixed(1)}%`
                          },
                          {
                            title: 'Improvement',
                            dataIndex: 'improvement',
                            key: 'improvement',
                            render: (val: number) => {
                              const value = (val * 100).toFixed(1);
                              return (
                                <Tag color={val > 0 ? 'green' : val < 0 ? 'red' : 'default'}>
                                  {value}%
                                </Tag>
                              );
                            }
                          }
                        ]}
                      />
                    ) : (
                      <Empty description="No training data available" />
                    )}
                  </Card>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </>
      )}
    </div>
  );
};

export default FeedbackDashboard; 