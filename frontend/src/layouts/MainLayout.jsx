import React from 'react';
import { Layout, Typography, Button, Space, message } from 'antd';
import { useNavigate, Outlet } from 'react-router-dom';
import { getAdmin, clearAuth } from '../utils/auth';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const MainLayout = () => {
  const navigate = useNavigate();
  const admin = getAdmin();

  const handleLogout = () => {
    clearAuth();
    message.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/logo.jpeg"
            alt="System Logo"
            style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }} // Hides image if not found yet
          />
          <Title level={4} style={{ margin: 0 }}>Photo Frame & Lamination Order System</Title>
        </div>
        <Space size="large">
          <Text type="secondary"><UserOutlined /> {admin?.username || 'Admin'}</Text>
          <Button type="text" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </Header>
      <Content style={{ padding: '24px' }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 380, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Outlet />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Photo Frame & Lamination Order System ©{new Date().getFullYear()}
      </Footer>
    </Layout>
  );
};

export default MainLayout;
