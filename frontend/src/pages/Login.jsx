import React, { useState } from 'react';
import { Typography, Card, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { saveAuth } from '../utils/auth';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', values);

      if (data.success) {
        saveAuth(data.token, data.admin);
        message.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <img
          src="/logo.jpeg"
          alt="System Logo"
          style={{ width: '80px', height: 'auto', marginBottom: '16px', objectFit: 'contain' }}
          onError={(e) => { e.target.style.display = 'none'; }} // Hides image if not found yet
        />
        <Title level={2} style={{ marginBottom: 4 }}>Admin Login</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Photo Frame & Lamination Order System</Text>

        <Form
          name="login_form"
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input placeholder="Username" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" size="large" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
