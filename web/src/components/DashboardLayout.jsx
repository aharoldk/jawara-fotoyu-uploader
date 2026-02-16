import { useState } from 'react';
import { Layout, Menu } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './DashboardLayout.css';

const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/dashboard',
            icon: <DashboardOutlined />,
            label: 'Dashboard',
            onClick: () => navigate('/dashboard'),
        },
        {
            key: '/customers',
            icon: <UserOutlined />,
            label: 'Customers',
            onClick: () => navigate('/customers'),
        },
    ];

    const selectedKey = location.pathname;

    return (
        <Layout className="dashboard-layout-wrapper">
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                theme="light"
                width={250}
            >
                <div className="logo">
                    <h2>{collapsed ? 'F' : 'Fotoyu'}</h2>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                />
            </Sider>
            <Layout>
                <Header className="site-header">
                    <div className="header-content">
                        <h3>Admin Panel</h3>
                        <div className="header-actions" onClick={handleLogout}>
                            <LogoutOutlined />
                            <span>Logout</span>
                        </div>
                    </div>
                </Header>
                <Content className="site-content">
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
};

export default DashboardLayout;

