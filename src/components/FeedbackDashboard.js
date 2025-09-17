import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, Typography, Divider, Table, Button, Alert, Select, Spin, Space, Tag, Row, Col, Statistic, Collapse, Progress, Pagination, Empty } from 'antd';
import { BookOutlined, PieChartOutlined, SyncOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { trainingService } from '../utils/trainingService';
import { logger } from '../utils/logger';
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28BDB'];
const FeedbackDashboard = () => {
    const [feedbackItems, setFeedbackItems] = useState([]);
    const [stats, setStats] = useState({
        totalFeedback: 0,
        ratingAverage: 0,
        correctPercentage: 0,
        incorrectPercentage: 0,
        neutralPercentage: 0,
        analysisCounts: {},
    });
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1); // Ant Design uses 1-based pagination
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [trainingTask, setTrainingTask] = useState('fallacy');
    const [isModelTraining, setIsModelTraining] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState(null);
    const [trainingMetrics, setTrainingMetrics] = useState([]);
    // Load feedback data
    useEffect(() => {
        const loadFeedback = async () => {
            setIsLoading(true);
            try {
                // For demo, we'll load from localStorage as fallback if ChromaDB is unavailable
                const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
                setFeedbackItems(localFeedback);
                calculateStats(localFeedback);
            }
            catch (error) {
                logger.error('Error loading feedback data:', error);
            }
            finally {
                setIsLoading(false);
            }
        };
        loadFeedback();
    }, []);
    // Calculate statistics from feedback data
    const calculateStats = (items) => {
        if (!items.length) {
            return;
        }
        const totalItems = items.length;
        // Count feedback by analysis type
        const analysisCounts = {};
        items.forEach(item => {
            if (!analysisCounts[item.analysisType]) {
                analysisCounts[item.analysisType] = 0;
            }
            analysisCounts[item.analysisType]++;
        });
        // Calculate rating average
        const ratings = items
            .filter(item => item.userFeedback.rating !== null)
            .map(item => item.userFeedback.rating);
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
    const formatDate = (timestamp) => {
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
    const handleChangePage = (newPage, pageSize) => {
        setPage(newPage);
        setRowsPerPage(pageSize);
    };
    // Load training metrics
    useEffect(() => {
        setTrainingMetrics(trainingService.getTrainingMetrics());
    }, [isModelTraining]);
    // Handle training task selection change
    const handleTrainingTaskChange = (value) => {
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
            }
            else {
                setTrainingStatus('Training failed. Not enough data or other error.');
            }
        }
        catch (error) {
            logger.error('Error during model training:', error);
            setTrainingStatus('An error occurred during training.');
        }
        finally {
            setIsModelTraining(false);
        }
    };
    // Define table columns for feedback items
    const columns = [
        {
            title: 'Analysis Type',
            dataIndex: 'analysisType',
            key: 'analysisType',
            render: (text) => _jsx(Tag, { color: "blue", children: text })
        },
        {
            title: 'Correct?',
            dataIndex: ['userFeedback', 'isCorrect'],
            key: 'isCorrect',
            render: (isCorrect) => {
                if (isCorrect === true)
                    return _jsx(Tag, { color: "green", children: "Yes" });
                if (isCorrect === false)
                    return _jsx(Tag, { color: "red", children: "No" });
                return _jsx(Tag, { color: "default", children: "N/A" });
            }
        },
        {
            title: 'Rating',
            dataIndex: ['userFeedback', 'rating'],
            key: 'rating',
            render: (rating) => rating !== null ? `${rating}/5` : 'N/A'
        },
        {
            title: 'Comment',
            dataIndex: ['userFeedback', 'comment'],
            key: 'comment',
            render: (comment) => comment || 'No comment'
        },
        {
            title: 'Date',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (timestamp) => formatDate(timestamp)
        }
    ];
    return (_jsxs("div", { style: { padding: 20 }, children: [_jsx(Title, { level: 2, children: "Feedback Dashboard" }), _jsx(Paragraph, { type: "secondary", children: "View and analyze user feedback on content analysis" }), _jsx(Divider, {}), isLoading ? (_jsxs("div", { style: { textAlign: 'center', padding: 50 }, children: [_jsx(Spin, { size: "large" }), _jsx("div", { style: { marginTop: 16 }, children: "Loading feedback data..." })] })) : (_jsxs(_Fragment, { children: [_jsxs(Row, { gutter: 16, style: { marginBottom: 24 }, children: [_jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Total Feedback", value: stats.totalFeedback, prefix: _jsx(PieChartOutlined, {}) }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Average Rating", value: stats.ratingAverage, suffix: "/5", precision: 1 }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Correctness Rate", value: stats.correctPercentage, suffix: "%", valueStyle: { color: '#3f8600' } }) }) }), _jsx(Col, { span: 6, children: _jsx(Card, { children: _jsx(Statistic, { title: "Incorrectness Rate", value: stats.incorrectPercentage, suffix: "%", valueStyle: { color: '#cf1322' } }) }) })] }), _jsxs(Row, { gutter: 16, style: { marginBottom: 24 }, children: [_jsx(Col, { span: 12, children: _jsx(Card, { title: "Accuracy Distribution", children: _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: accuracyData, cx: "50%", cy: "50%", labelLine: false, outerRadius: 80, fill: "#8884d8", dataKey: "value", label: ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`, children: accuracyData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) }) }) }), _jsx(Col, { span: 12, children: _jsx(Card, { title: "Analysis Type Distribution", children: _jsx(ResponsiveContainer, { width: "100%", height: 250, children: _jsxs(BarChart, { data: analysisTypeData, margin: { top: 20, right: 30, left: 20, bottom: 5 }, children: [_jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "count", fill: "#8884d8" })] }) }) }) })] }), _jsxs(Card, { title: "Recent Feedback", style: { marginBottom: 24 }, children: [_jsx(Table, { dataSource: feedbackItems.slice((page - 1) * rowsPerPage, page * rowsPerPage), columns: columns, rowKey: (record) => `${record.articleId}-${record.timestamp}`, pagination: false }), _jsx("div", { style: { marginTop: 16, display: 'flex', justifyContent: 'flex-end' }, children: _jsx(Pagination, { current: page, pageSize: rowsPerPage, total: feedbackItems.length, onChange: handleChangePage, showSizeChanger: true }) })] }), _jsx(Collapse, { style: { marginBottom: 24 }, children: _jsx(Panel, { header: _jsxs(Space, { children: [_jsx(BookOutlined, {}), _jsx("span", { children: "Model Training & Improvement" })] }), children: _jsxs(Row, { gutter: 16, children: [_jsx(Col, { span: 12, children: _jsx(Card, { title: "Train Model with Feedback", children: _jsxs(Space, { direction: "vertical", style: { width: '100%' }, children: [_jsx(Text, { children: "Select analysis type to train:" }), _jsxs(Select, { style: { width: 200 }, value: trainingTask, onChange: handleTrainingTaskChange, disabled: isModelTraining, children: [_jsx(Option, { value: "fallacy", children: "Fallacy Detection" }), _jsx(Option, { value: "sentiment", children: "Sentiment Analysis" }), _jsx(Option, { value: "summary", children: "Summary Generation" })] }), _jsx(Button, { type: "primary", onClick: startModelTraining, loading: isModelTraining, icon: _jsx(SyncOutlined, {}), style: { marginTop: 16 }, children: isModelTraining ? "Training..." : "Start Training" }), trainingStatus && (_jsx(Alert, { message: trainingStatus, type: trainingStatus.includes('completed') ? 'success' :
                                                            trainingStatus.includes('failed') || trainingStatus.includes('error') ? 'error' : 'info', style: { marginTop: 16 } })), isModelTraining && (_jsx(Progress, { percent: 65, status: "active", style: { marginTop: 16 } }))] }) }) }), _jsx(Col, { span: 12, children: _jsx(Card, { title: "Training History", children: trainingMetrics.length > 0 ? (_jsx(Table, { dataSource: trainingMetrics, pagination: false, columns: [
                                                    {
                                                        title: 'Task',
                                                        dataIndex: 'task',
                                                        key: 'task'
                                                    },
                                                    {
                                                        title: 'Initial Accuracy',
                                                        dataIndex: 'initialAccuracy',
                                                        key: 'initialAccuracy',
                                                        render: (val) => `${(val * 100).toFixed(1)}%`
                                                    },
                                                    {
                                                        title: 'Final Accuracy',
                                                        dataIndex: 'finalAccuracy',
                                                        key: 'finalAccuracy',
                                                        render: (val) => `${(val * 100).toFixed(1)}%`
                                                    },
                                                    {
                                                        title: 'Improvement',
                                                        dataIndex: 'improvement',
                                                        key: 'improvement',
                                                        render: (val) => {
                                                            const value = (val * 100).toFixed(1);
                                                            return (_jsxs(Tag, { color: val > 0 ? 'green' : val < 0 ? 'red' : 'default', children: [value, "%"] }));
                                                        }
                                                    }
                                                ] })) : (_jsx(Empty, { description: "No training data available" })) }) })] }) }, "1") })] }))] }));
};
export default FeedbackDashboard;
