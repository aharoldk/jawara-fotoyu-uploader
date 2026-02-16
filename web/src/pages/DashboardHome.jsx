import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { customerAPI } from '../api';

const DashboardHome = () => {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        expired: 0,
    });

    const fetchStats = async () => {
        try {
            const response = await customerAPI.getAll();
            const customers = response.data.customers;

            const now = new Date();
            const active = customers.filter(c =>
                c.subscriptionExpiredAt && new Date(c.subscriptionExpiredAt) > now
            ).length;

            const expired = customers.filter(c =>
                c.subscriptionExpiredAt && new Date(c.subscriptionExpiredAt) <= now
            ).length;

            setStats({
                total: customers.length,
                active,
                expired,
            });
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return (
        <div>
            <h1 style={{ marginBottom: 24 }}>Dashboard</h1>
            <Row gutter={16}>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Total Customers"
                            value={stats.total}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#667eea' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Active Subscriptions"
                            value={stats.active}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card>
                        <Statistic
                            title="Expired Subscriptions"
                            value={stats.expired}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#ff4d4f' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default DashboardHome;

