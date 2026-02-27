import { useState, useEffect } from 'react';
import {
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
    Select,
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    CalendarOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { customerAPI } from '../api';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const CustomersPage = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [form] = Form.useForm();
    const [subscriptionForm] = Form.useForm();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await customerAPI.getAll();
            // Map _id to id for frontend compatibility
            const mappedCustomers = response.data.customers.map(customer => ({
                ...customer,
                id: customer._id || customer.id,
            }));
            setCustomers(mappedCustomers);
        } catch (error) {
            message.error('Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingCustomer(null);
        form.resetFields();
        setModalVisible(true);
    };

    const handleEdit = (record) => {
        setEditingCustomer(record);
        console.log(record);
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
            subscriptionType: record.subscriptionType || 'Normal',
            subscriptionExpiredAt: record.subscriptionExpiredAt
                ? dayjs(record.subscriptionExpiredAt)
                : null,
        });
        setSubscriptionModalVisible(true);
    };

    const handleInvalidateSession = async (id, username) => {
        try {
            await customerAPI.invalidateSession(username);
            message.success(`Session invalidated for ${username}. They will be logged out on next action.`);
        } catch (error) {
            message.error('Failed to invalidate session');
        }
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
                console.log('Updating customer:', editingCustomer.id, data);
                await customerAPI.update(editingCustomer._id, data);
                message.success('Customer updated successfully');
            } else {
                console.log('Creating customer:', data);
                await customerAPI.create(data);
                message.success('Customer created successfully');
            }

            setModalVisible(false);
            form.resetFields();
            fetchCustomers();
        } catch (error) {
            console.error('Error saving customer:', error);
            if (error.errorFields) {
                message.error('Please fill in all required fields');
            } else {
                const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
                message.error(errorMessage);
            }
        }
    };

    const handleSubscriptionOk = async () => {
        try {
            const values = await subscriptionForm.validateFields();
            const subscriptionExpiredAt = values.subscriptionExpiredAt
                ? values.subscriptionExpiredAt.toISOString()
                : null;

            await customerAPI.updateSubscription(
                selectedCustomer.id,
                values.subscriptionType,
                subscriptionExpiredAt
            );
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
            render: (username, record) => (
                <a
                    onClick={() => handleEdit(record)}
                    style={{ cursor: 'pointer', color: '#1890ff' }}
                >
                    {username}
                </a>
            ),
        },
        {
            title: 'Type',
            dataIndex: 'subscriptionType',
            key: 'subscriptionType',
            width: 100,
            render: (type) => (
                <Tag color={type === 'Pro' ? 'blue' : 'default'}>
                    {type || 'Normal'}
                </Tag>
            ),
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
            title: 'Actions',
            key: 'actions',
            fixed: 'right',
            width: 60,
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button
                        type="primary"
                        size="small"
                        icon={<CalendarOutlined />}
                        onClick={() => handleSubscription(record)}
                        />
                    <Popconfirm
                        title="Invalidate Session"
                        description="Force logout this customer from all devices?"
                        onConfirm={() => handleInvalidateSession(record.id, record.username)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            type="default"
                            size="small"
                            icon={<LogoutOutlined />}
                            danger
                        />
                    </Popconfirm>
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
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>Customers</Title>
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
                scroll={{ x: 1400 }}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} customers`,
                }}
            />

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

                    <Form.Item name="city" label="City">
                        <Input placeholder="Enter city" />
                    </Form.Item>

                    <Form.Item name="whatsapp" label="WhatsApp">
                        <Input placeholder="Enter WhatsApp number" />
                    </Form.Item>

                    <Form.Item name="pricePhoto" label="Price Photo">
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Enter photo price"
                            min={0}
                            formatter={(value) =>
                                `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) => value.replace(/Rp\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item name="priceVideo" label="Price Video">
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Enter video price"
                            min={0}
                            formatter={(value) =>
                                `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) => value.replace(/Rp\s?|(,*)/g, '')}
                        />
                    </Form.Item>

                    <Form.Item
                        name="concurrentBot"
                        label="Concurrent Bot"
                        tooltip="Number of browser bots to use for concurrent uploads (1-100)"
                    >
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="Enter concurrent bot (1-100)"
                            min={1}
                            max={100}
                            defaultValue={1}
                        />
                    </Form.Item>

                    <Form.Item
                        name="subscriptionType"
                        label="Subscription Type"
                        initialValue="Normal"
                    >
                        <Select placeholder="Select subscription type">
                            <Select.Option value="Normal">Normal</Select.Option>
                            <Select.Option value="Pro">Pro</Select.Option>
                        </Select>
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
                        name="subscriptionType"
                        label="Subscription Type"
                        rules={[{ required: true, message: 'Please select subscription type!' }]}
                    >
                        <Select placeholder="Select subscription type">
                            <Select.Option value="Normal">Normal</Select.Option>
                            <Select.Option value="Pro">Pro</Select.Option>
                        </Select>
                    </Form.Item>

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
        </div>
    );
};

export default CustomersPage;

