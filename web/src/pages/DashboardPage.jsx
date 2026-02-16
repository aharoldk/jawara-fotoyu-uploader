import { useState, useEffect } from 'react';
import {
    Layout,
    Table,
    Button,
    Space,
    Modal,
    Form,
    Input,
    InputNumber,
    DatePicker,
    message,
    Popconfirm,
    Tag,
    Typography,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    LogoutOutlined,
    CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import dayjs from 'dayjs';
import './DashboardPage.css';

const { Header, Content } = Layout;
const { Title } = Typography;
const { TextArea } = Input;

const DashboardPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [form] = Form.useForm();
    const [subscriptionForm] = Form.useForm();
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await customerAPI.getAll();
            setCustomers(response.data.customers);
        } catch (error) {
            message.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleCreate = () => {
        setEditingCustomer(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingCustomer(record);
        form.setFieldsValue({
            ...record,
            subscriptionExpiredAt: record.subscriptionExpiredAt
                ? dayjs(record.subscriptionExpiredAt)
                : null,
        });
        setModalVisible(true);
    };

    const handleDelete = async (id) => {
        try {
            await customerAPI.delete(id);
            message.success('Customer deleted successfully');
            fetchCustomers();
        } catch (error) {
            message.error('Failed to delete customer');
        }
    };

    const handleSubscription = (record) => {
        setSelectedCustomer(record);
        subscriptionForm.setFieldsValue({
            subscriptionExpiredAt: record.subscriptionExpiredAt
                ? dayjs(record.subscriptionExpiredAt)
                : null,
        });
        setSubscriptionModalVisible(true);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const data = {
                ...values,
                subscriptionExpiredAt: values.subscriptionExpiredAt
                    ? values.subscriptionExpiredAt.toISOString()
                    : null,
            };

            if (editingCustomer) {
                await customerAPI.update(editingCustomer.id, data);
                message.success('Customer updated successfully');
            } else {
                await customerAPI.create(data);
                message.success('Customer created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchCustomers();
        } catch (error) {
            if (error.errorFields) {
                message.error('Please fill in all required fields');
            } else {
                message.error(error.response?.data?.message || 'Operation failed');
            }
        }
    };

    const handleSubscriptionOk = async () => {
        try {
            const values = await subscriptionForm.validateFields();
            const subscriptionExpiredAt = values.subscriptionExpiredAt
                ? values.subscriptionExpiredAt.toISOString()
                : null;

            await customerAPI.updateSubscription(selectedCustomer.id, subscriptionExpiredAt);
            message.success('Subscription updated successfully');

            setSubscriptionModalVisible(false);
            subscriptionForm.resetFields();
            fetchCustomers();
        } catch (error) {
            message.error('Failed to update subscription');
        }
    };

    const columns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            fixed: 'left',
            width: 120,
        },
        {
            title: 'City',
            dataIndex: 'city',
            key: 'city',
            width: 100,
        },
        {
            title: 'WhatsApp',
            dataIndex: 'whatsapp',
            key: 'whatsapp',
            width: 130,
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            width: 100,
            render: (price) => price ? `Rp ${price.toLocaleString()}` : '-',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
            width: 200,
            ellipsis: true,
        },
        {
            title: 'Subscription',
            dataIndex: 'subscriptionExpiredAt',
            key: 'subscriptionExpiredAt',
            width: 150,
            render: (date) => {
                if (!date) return <Tag color="default">No Subscription</Tag>;

                const expDate = dayjs(date);
                const isExpired = expDate.isBefore(dayjs());

                return (
                    <Tag color={isExpired ? 'red' : 'green'}>
                        {expDate.format('YYYY-MM-DD')}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 200,
            render: (_, record) => (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<CalendarOutlined />}
                        onClick={() => handleSubscription(record)}
                    >
                        Subscription
                    </Button>
                    <Button
                        type="default"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                    />
                    <Popconfirm
                        title="Delete customer"
                        description="Are you sure you want to delete this customer?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Layout className="dashboard-layout">
            <Header className="dashboard-header">
                <div className="header-content">
                    <Title level={3} style={{ color: 'white', margin: 0 }}>
                        Customer Management Dashboard
                    </Title>
                    <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>
            </Header>
            <Content className="dashboard-content">
                <div className="content-header">
                    <Title level={4}>Customers</Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                        size="large"
                    >
                        Add Customer
                    </Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={customers}
                    loading={loading}
                    rowKey="id"
                    scroll={{ x: 1300 }}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} customers`,
                    }}
                />
            </Content>

            {/* Create/Edit Customer Modal */}
            <Modal
                title={editingCustomer ? 'Edit Customer' : 'Create Customer'}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                width={600}
                okText={editingCustomer ? 'Update' : 'Create'}
            >
                <Form
                    form={form}
                    layout="vertical"
                    autoComplete="off"
                >
                    <Form.Item
                        name="username"
                        label="Username"
                        rules={[{ required: true, message: 'Please input username!' }]}
                    >
                        <Input placeholder="Enter username" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[
                            {
                                required: !editingCustomer,
                                message: 'Please input password!',
                            },
                            {
                                min: 6,
                                message: 'Password must be at least 6 characters',
                            },
                        ]}
                    >
                        <Input.Password
                            placeholder={
                                editingCustomer
                                    ? 'Leave blank to keep current password'
                                    : 'Enter password'
                            }
                        />
                    </Form.Item>

                    <Form.Item name="city" label="City">
                        <Input placeholder="Enter city" />
                    </Form.Item>

                    <Form.Item name="whatsapp" label="WhatsApp">
                        <Input placeholder="Enter WhatsApp number" />
                    </Form.Item>

                    <Form.Item name="price" label="Price">
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Enter price"
                            min={0}
                            formatter={(value) =>
                                `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) => value.replace(/Rp\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item name="description" label="Description">
                        <TextArea
                            rows={4}
                            placeholder="Enter description"
                        />
                    </Form.Item>

                    <Form.Item name="subscriptionExpiredAt" label="Subscription Expires At">
                        <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Update Subscription Modal */}
            <Modal
                title="Update Subscription"
                open={subscriptionModalVisible}
                onOk={handleSubscriptionOk}
                onCancel={() => {
                    setSubscriptionModalVisible(false);
                    subscriptionForm.resetFields();
                }}
                okText="Update"
            >
                <Form
                    form={subscriptionForm}
                    layout="vertical"
                    autoComplete="off"
                >
                    <Form.Item
                        name="subscriptionExpiredAt"
                        label="Subscription Expires At"
                        rules={[{ required: true, message: 'Please select expiration date!' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </Layout>
    );
};

export default DashboardPage;

