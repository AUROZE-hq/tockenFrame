import React, { useState, useEffect } from 'react';
import { 
  Typography, Card, Row, Col, Button, Table, Tag, Space, 
  Input, Select, Modal, Form, Popconfirm, message, Tooltip, Drawer, Dropdown, Checkbox 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, 
  CarOutlined, StopOutlined, MessageOutlined, WarningOutlined, WhatsAppOutlined, PrinterOutlined
} from '@ant-design/icons';
import * as orderApi from '../api/orderApi';
import * as whatsappLogApi from '../api/whatsappLogApi';
import * as smsLogApi from '../api/smsLogApi';
import * as inventoryApi from '../api/inventoryApi';
import { getAdmin } from '../utils/auth';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import { printOrderSlip } from '../utils/printOrderSlip';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const Dashboard = () => {
  const admin = getAdmin();
  const [form] = Form.useForm();
  const [clearForm] = Form.useForm();
  const [inventoryForm] = Form.useForm();
  
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState({ frameStock: 0, printStock: 0 });
  const [loading, setLoading] = useState(false);
  
  // Filters state
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    orderType: 'all',
    serviceType: 'all',
    workStatus: 'all',
    deliveryStatus: 'all',
    cancelled: 'all'
  });

  // Modals and Drawers
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [clearModalVisible, setClearModalVisible] = useState(false);
  const [clearing, setClearing] = useState(false);

  const [logsDrawerVisible, setLogsDrawerVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const [smsLogsDrawerVisible, setSmsLogsDrawerVisible] = useState(false);
  const [smsLogs, setSmsLogs] = useState([]);
  const [smsLogsLoading, setSmsLogsLoading] = useState(false);

  const [autoPrint, setAutoPrint] = useState(true);
  const [formOrderType, setFormOrderType] = useState('onspot');

  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [updatingInventory, setUpdatingInventory] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = { search, ...filters };
      const { data } = await orderApi.getOrders(params);
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const { data } = await inventoryApi.getInventory();
      if (data) {
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to load inventory');
    }
  };

  useEffect(() => {
    loadOrders();
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  // Derived Summary Data
  const totalOrders = orders.length;
  const pendingWork = orders.filter(o => o.workStatus === 'pending' && !o.isCancelled).length;
  const workDone = orders.filter(o => o.workStatus === 'done' && !o.isCancelled).length;
  const delivered = orders.filter(o => o.deliveryStatus === 'delivered' && !o.isCancelled).length;
  const cancelledOrders = orders.filter(o => o.isCancelled).length;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // WhatsApp Logs
  const loadWhatsAppLogs = async () => {
    setLogsLoading(true);
    try {
      const { data } = await whatsappLogApi.getWhatsAppLogs();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      message.error('Failed to load WhatsApp logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const openLogsDrawer = () => {
    setLogsDrawerVisible(true);
    loadWhatsAppLogs();
  };

  // SMS Logs
  const loadSmsLogs = async () => {
    setSmsLogsLoading(true);
    try {
      const { data } = await smsLogApi.getSmsLogs();
      if (data.success) {
        setSmsLogs(data.data);
      }
    } catch (error) {
      message.error('Failed to load SMS logs');
    } finally {
      setSmsLogsLoading(false);
    }
  };

  const openSmsLogsDrawer = () => {
    setSmsLogsDrawerVisible(true);
    loadSmsLogs();
  };

  // Clear All Data
  const handleClearAllSubmit = async (values) => {
    try {
      setClearing(true);
      const { data } = await orderApi.clearAllOrders(values.password);
      if (data.success) {
        message.success('All order data cleared successfully');
        setClearModalVisible(false);
        clearForm.resetFields();
        loadOrders();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to clear data');
    } finally {
      setClearing(false);
    }
  };

  // Order Actions
  const handleAdd = () => {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({ orderType: 'onspot' });
    setFormOrderType('onspot');
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingOrder(record);
    form.setFieldsValue(record);
    setFormOrderType(record.orderType);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await orderApi.deleteOrder(id);
      message.success('Order deleted successfully');
      loadOrders();
    } catch (error) {
      message.error('Failed to delete order');
    }
  };

  const handleCancelOrder = async (id) => {
    try {
      await orderApi.cancelOrder(id);
      message.success('Order cancelled successfully');
      loadOrders();
    } catch (error) {
      message.error('Failed to cancel order');
    }
  };

  const handleMarkWorkDone = async (id) => {
    try {
      const response = await orderApi.markWorkDone(id);
      if (response.data?.sms?.status === 'failed') {
        message.warning('Work marked as done, but SMS failed to send.');
      } else {
        message.success('Work marked as done');
      }
      loadOrders();
    } catch (error) {
      message.error('Failed to mark work done');
    }
  };

  const handleMarkDeliveryDone = async (id) => {
    try {
      await orderApi.markDeliveryDone(id);
      message.success('Delivery marked as done');
      loadOrders();
    } catch (error) {
      message.error('Failed to mark delivery done');
    }
  };

  // handleManualWhatsApp removed as we now use direct links

  const onModalSubmit = async (values) => {
    try {
      setSubmitting(true);
      if (editingOrder) {
        await orderApi.updateOrder(editingOrder._id, values);
        message.success('Order updated successfully');
      } else {
        const response = await orderApi.createOrder(values);
        if (response.data?.sms?.status === 'failed') {
          message.warning('Order created successfully, but SMS failed to send.');
        } else {
          message.success('Order created and SMS sent successfully.');
        }

        // Auto-print receipt if enabled
        if (autoPrint && response.data?.success) {
          const printResult = printOrderSlip(response.data.data);
          if (!printResult) {
            message.error('Print window was blocked. Please allow popups or use Reprint.');
          }
        }
      }
      setModalVisible(false);
      loadOrders();
      
      // Fetch latest inventory to check for alert
      const invResponse = await inventoryApi.getInventory();
      if (invResponse.data) {
        const newInventory = invResponse.data;
        setInventory(newInventory);

        // Alert only if Frame was ordered and stock is low
        const frameWasOrdered = values.serviceType === 'frame' || values.serviceType === 'both';
        if (frameWasOrdered && newInventory.frameStock <= 5) {
          Modal.warning({
            title: '⚠️ LOW FRAME STOCK',
            content: (
              <div>
                <p>You just placed a Frame order and your stock is now low!</p>
                <Title level={4} type="danger">Remaining Frames: {newInventory.frameStock}</Title>
                <p>Please restock soon.</p>
              </div>
            ),
            okText: 'Understood'
          });
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: text => new Date(text).toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    },
    {
      title: 'Photo No',
      dataIndex: 'photoNumber',
      key: 'photoNumber',
      render: text => <strong>{text}</strong>
    },
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Phone',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: text => text || '-'
    },
    {
      title: 'Order Type',
      dataIndex: 'orderType',
      key: 'orderType',
      render: type => (
        <Tag color={type === 'onspot' ? 'blue' : 'purple'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Service Type',
      dataIndex: 'serviceType',
      key: 'serviceType',
      render: type => {
        let color = 'green';
        if (type === 'frame') color = 'cyan';
        if (type === 'print') color = 'orange';
        return <Tag color={color}>{type.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Work Status',
      dataIndex: 'workStatus',
      key: 'workStatus',
      render: status => (
        <Tag color={status === 'pending' ? 'gold' : 'green'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Delivery',
      dataIndex: 'deliveryStatus',
      key: 'deliveryStatus',
      render: status => (
        <Tag color={status === 'not_delivered' ? 'red' : 'green'}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isCancelled',
      key: 'isCancelled',
      render: cancelled => (
        cancelled ? <Tag color="red">CANCELLED</Tag> : <Tag color="blue">ACTIVE</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const urlPlaced = buildWhatsAppUrl(record.phoneNumber, `Your order has been successfully placed. Photo No: ${record.photoNumber}`);
        const urlCompleted = buildWhatsAppUrl(record.phoneNumber, `Your order is complete. You can collect it from the delivery area. Photo No: ${record.photoNumber}`);

        const whatsappMenu = {
          items: [
            {
              key: 'placed',
              label: (
                <a 
                  href={urlPlaced || '#'} 
                  target="whatsapp_window" 
                  onClick={(e) => {
                    if (!urlPlaced) {
                      e.preventDefault();
                      message.error('Invalid phone number format.');
                    }
                  }}
                >
                  Order Placed
                </a>
              )
            },
            ...(record.orderType === 'onspot' && record.workStatus === 'done' && !record.isCancelled ? [{
              key: 'completed',
              label: (
                <a 
                  href={urlCompleted || '#'} 
                  target="whatsapp_window" 
                  onClick={(e) => {
                    if (!urlCompleted) {
                      e.preventDefault();
                      message.error('Invalid phone number format.');
                    }
                  }}
                >
                  Work Completed
                </a>
              )
            }] : [])
          ]
        };

        return (
          <Space size="small">
            <Tooltip title="Edit Order">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
                disabled={record.isCancelled || record.deliveryStatus === 'delivered'}
              />
            </Tooltip>

            {!record.isCancelled && record.workStatus === 'pending' && (
              <Tooltip title="Mark Work Done">
                <Popconfirm
                  title="Mark this order work as completed?"
                  onConfirm={() => handleMarkWorkDone(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" style={{ color: '#52c41a' }} icon={<CheckCircleOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}

            {!record.isCancelled && record.workStatus === 'done' && record.deliveryStatus === 'not_delivered' && (
              <Tooltip title="Mark Delivered">
                <Popconfirm
                  title="Mark this order as delivered?"
                  onConfirm={() => handleMarkDeliveryDone(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" style={{ color: '#1890ff' }} icon={<CarOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}

            <Dropdown menu={whatsappMenu} trigger={['click']}>
              <Tooltip title="Manual WhatsApp Message">
                <Button type="text" style={{ color: '#25D366' }} icon={<WhatsAppOutlined />} />
              </Tooltip>
            </Dropdown>

            <Tooltip title="Reprint Order Slip">
              <Button 
                type="text" 
                icon={<PrinterOutlined />} 
                onClick={() => {
                  const result = printOrderSlip(record);
                  if (!result) {
                    message.error('Print window was blocked. Please allow popups.');
                  }
                }}
              />
            </Tooltip>

            {!record.isCancelled && record.deliveryStatus !== 'delivered' && (
              <Tooltip title="Cancel Order">
                <Popconfirm
                  title="Are you sure you want to cancel this order?"
                  onConfirm={() => handleCancelOrder(record._id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button type="text" danger icon={<StopOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}

            <Tooltip title="Delete Order">
              <Popconfirm
                title="Are you sure you want to delete this order permanently?"
                onConfirm={() => handleDelete(record._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  const handleInventorySubmit = async (values) => {
    try {
      setUpdatingInventory(true);
      const response = await inventoryApi.updateInventory(values);
      if (response.success) {
        message.success('Inventory updated successfully');
        setInventoryModalVisible(false);
        inventoryForm.resetFields();
        loadInventory();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update inventory');
    } finally {
      setUpdatingInventory(false);
    }
  };

  const logsColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'createdAt',
      render: text => new Date(text).toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber'
    },
    {
      title: 'Message Type',
      dataIndex: 'messageType',
      render: type => {
        if (type === 'order_placed') return 'Order Placed';
        if (type === 'work_completed') return 'Work Completed';
        return type;
      }
    },
    {
      title: 'Status',
      dataIndex: 'messageStatus',
      render: status => {
        let color = 'gray';
        if (status === 'sent') color = 'green';
        if (status === 'simulated') color = 'purple';
        if (status === 'failed') color = 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Message Text',
      dataIndex: 'messageText'
    },
    {
      title: 'Error Message',
      dataIndex: 'errorMessage',
      render: text => text || '-'
    },
    {
      title: 'Related Order',
      dataIndex: 'orderId',
      render: order => {
        if (!order) return '-';
        return `${order.photoNumber} - ${order.customerName}`;
      }
    }
  ];

  const smsLogsColumns = [
    {
      title: 'Date/Time',
      dataIndex: 'createdAt',
      render: text => new Date(text).toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      })
    },
    {
      title: 'Phone Number',
      dataIndex: 'phoneNumber'
    },
    {
      title: 'Normalized Number',
      dataIndex: 'normalizedPhoneNumber',
      render: text => text || '-'
    },
    {
      title: 'Message Type',
      dataIndex: 'messageType',
      render: type => {
        if (type === 'order_placed') return 'Order Placed';
        if (type === 'work_completed') return 'Work Completed';
        return type;
      }
    },
    {
      title: 'Status',
      dataIndex: 'messageStatus',
      render: status => {
        let color = 'gray';
        if (status === 'sent') color = 'green';
        if (status === 'simulated') color = 'orange';
        if (status === 'failed') color = 'red';
        return <Tag color={color}>{status ? status.toUpperCase() : 'UNKNOWN'}</Tag>;
      }
    },
    {
      title: 'Message Text',
      dataIndex: 'messageText'
    },
    {
      title: 'Error Message',
      dataIndex: 'errorMessage',
      render: text => text || '-'
    },
    {
      title: 'Related Order',
      dataIndex: 'orderId',
      render: order => {
        if (!order) return '-';
        return `${order.photoNumber} - ${order.customerName}`;
      }
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Order Dashboard</Title>
          <Text type="secondary">
            <PrinterOutlined /> Set Xprinter 80C as the default printer for faster printing.
          </Text>
        </div>
        <Space wrap>
          <Button icon={<MessageOutlined />} onClick={openSmsLogsDrawer}>
            SMS Logs
          </Button>
          <Button icon={<WhatsAppOutlined />} onClick={openLogsDrawer}>
            WhatsApp Logs
          </Button>
          <Button icon={<EditOutlined />} onClick={() => {
            inventoryForm.setFieldsValue({ 
              frameStock: inventory.frameStock
            });
            setInventoryModalVisible(true);
          }}>
            Update Stock
          </Button>
          <Button danger type="primary" icon={<WarningOutlined />} onClick={() => setClearModalVisible(true)}>
            Clear All Data
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Order
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Text type="secondary">Total Orders</Text>
            <Title level={3} style={{ margin: 0 }}>{totalOrders}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Text type="secondary">Pending Work</Text>
            <Title level={3} style={{ margin: 0, color: '#faad14' }}>{pendingWork}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Text type="secondary">Work Done</Text>
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>{workDone}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Text type="secondary">Delivered</Text>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>{delivered}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Text type="secondary">Cancelled</Text>
            <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>{cancelledOrders}</Title>
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderTop: `4px solid ${inventory.frameStock <= 5 ? '#ff4d4f' : '#1890ff'}` }}>
            <Text type="secondary">Frame Stock</Text>
            <Title level={3} style={{ margin: 0, color: inventory.frameStock <= 5 ? '#ff4d4f' : 'inherit' }}>
              {inventory.frameStock}
            </Title>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8}>
            <Search 
              placeholder="Search by photo no, name, phone, or address" 
              onSearch={setSearch} 
              enterButton 
              allowClear
            />
          </Col>
          <Col xs={24} md={16}>
            <Space wrap>
              <Select defaultValue="all" style={{ width: 120 }} onChange={v => handleFilterChange('orderType', v)}>
                <Option value="all">All Types</Option>
                <Option value="onspot">Onspot</Option>
                <Option value="preorder">Preorder</Option>
              </Select>
              <Select defaultValue="all" style={{ width: 140 }} onChange={v => handleFilterChange('serviceType', v)}>
                <Option value="all">All Services</Option>
                <Option value="frame">Frame</Option>
                <Option value="print">Print</Option>
                <Option value="both">Both</Option>
              </Select>
              <Select defaultValue="all" style={{ width: 140 }} onChange={v => handleFilterChange('workStatus', v)}>
                <Option value="all">All Work</Option>
                <Option value="pending">Pending</Option>
                <Option value="done">Done</Option>
              </Select>
              <Select defaultValue="all" style={{ width: 150 }} onChange={v => handleFilterChange('deliveryStatus', v)}>
                <Option value="all">All Delivery</Option>
                <Option value="not_delivered">Not Delivered</Option>
                <Option value="delivered">Delivered</Option>
              </Select>
              <Select defaultValue="all" style={{ width: 130 }} onChange={v => handleFilterChange('cancelled', v)}>
                <Option value="all">All Status</Option>
                <Option value="false">Active</Option>
                <Option value="true">Cancelled</Option>
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      <Table 
        columns={columns} 
        dataSource={orders} 
        rowKey="_id" 
        loading={loading}
        scroll={{ x: 1200 }}
        locale={{ emptyText: "No orders found" }}
      />

      <Modal
        title={editingOrder ? "Edit Order" : "Add Order"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onModalSubmit}
          initialValues={{ orderType: 'onspot' }}
          onValuesChange={(changedValues) => {
            if (changedValues.orderType) {
              setFormOrderType(changedValues.orderType);
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="photoNumber"
                label="Photo Number"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="e.g. P001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerName"
                label="Customer Name"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input placeholder="0771234567" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serviceType"
                label="Service Type"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Select placeholder="Select service">
                  <Option value="frame">Frame</Option>
                  <Option value="print">Print</Option>
                  <Option value="both">Both</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="orderType"
            label="Order Type"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select>
              <Option value="onspot">Onspot</Option>
              <Option value="preorder">Preorder</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[{ 
              required: formOrderType === 'preorder', 
              message: 'Address is required for preorder' 
            }]}
          >
            <Input.TextArea rows={3} placeholder="Customer address..." />
          </Form.Item>

          <Form.Item>
            <Checkbox 
              checked={autoPrint} 
              onChange={(e) => setAutoPrint(e.target.checked)}
            >
              Print slip after saving
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingOrder ? 'Update Order' : 'Create Order'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Clear All Data Modal */}
      <Modal
        title="Clear All Data"
        open={clearModalVisible}
        onCancel={() => setClearModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginBottom: 24 }}>
          <Text type="danger">
            This action will permanently delete all orders and WhatsApp logs. Admin accounts will not be deleted.
          </Text>
        </div>
        <Form form={clearForm} layout="vertical" onFinish={handleClearAllSubmit}>
          <Form.Item
            name="password"
            label="Admin Password"
            rules={[{ required: true, message: 'Please enter your admin password' }]}
            help="Admin password is required for safety."
          >
            <Input.Password placeholder="Enter admin password to confirm" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setClearModalVisible(false)}>Cancel</Button>
              <Button danger type="primary" htmlType="submit" loading={clearing}>
                Clear All Data
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Update Inventory Modal */}
      <Modal
        title="Update Inventory Stock"
        open={inventoryModalVisible}
        onCancel={() => setInventoryModalVisible(false)}
        footer={null}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">Set the total quantity available in your inventory.</Text>
        </div>
        <Form form={inventoryForm} layout="vertical" onFinish={handleInventorySubmit}>
          <Form.Item
            name="frameStock"
            label="Total Frame Count"
            rules={[{ required: true, message: 'Please enter frame count' }]}
          >
            <Input type="number" min={0} placeholder="e.g. 100" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Confirm with Admin Password"
            rules={[{ required: true, message: 'Admin password is required to change counts' }]}
          >
            <Input.Password placeholder="Enter password to confirm" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setInventoryModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updatingInventory}>
                Update Inventory
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* WhatsApp Logs Drawer */}
      <Drawer
        title="WhatsApp Message Logs"
        placement="right"
        width={800}
        onClose={() => setLogsDrawerVisible(false)}
        open={logsDrawerVisible}
        extra={
          <Button onClick={loadWhatsAppLogs} loading={logsLoading}>
            Refresh Logs
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" italic>
            WhatsApp Cloud API is not connected. <Tag color="purple" style={{ margin: '0 4px' }}>SIMULATED</Tag> means the system recorded the message action, but no automatic WhatsApp message was sent.
          </Text>
        </div>
        <Table 
          columns={logsColumns} 
          dataSource={logs} 
          rowKey="_id" 
          loading={logsLoading}
          scroll={{ x: 800 }}
          size="small"
        />
      </Drawer>

      {/* SMS Logs Drawer */}
      <Drawer
        title="SMS Message Logs"
        placement="right"
        width={900}
        onClose={() => setSmsLogsDrawerVisible(false)}
        open={smsLogsDrawerVisible}
        extra={
          <Button onClick={loadSmsLogs} loading={smsLogsLoading}>
            Refresh Logs
          </Button>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" italic>
            SMS messages are sent using Notify.lk API. If a message fails, check API key, account balance, sender ID, and phone number format.
          </Text>
        </div>
        <Table 
          columns={smsLogsColumns} 
          dataSource={smsLogs} 
          rowKey="_id" 
          loading={smsLogsLoading}
          scroll={{ x: 900 }}
          size="small"
        />
      </Drawer>

    </div>
  );
};

export default Dashboard;
