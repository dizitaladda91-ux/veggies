import React, { useEffect, useState } from 'react';
import { Card } from '../components/common/Card';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { fetchUsers, updateUserStatus, deleteUser } from '../services/adminService';
import { useNotification } from '../hooks/useNotification';
import { formatDate } from '../utils/formatters';
import { Search, UserCheck, UserX, Trash2 } from 'lucide-react';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { showSuccess, showError } = useNotification();

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers({ page, limit: 10, search, role: roleFilter });
      setUsers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      showError('Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateUserStatus(userId, newStatus);
      showSuccess(`User status changed to ${newStatus}`);
      loadUsers();
    } catch (err) {
      showError(err.message || 'Failed to update user status');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      showSuccess('User deleted successfully');
      loadUsers();
    } catch (err) {
      showError(err.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      header: 'Name / Email',
      accessor: 'email',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700 }}>{row.first_name ? `${row.first_name} ${row.last_name || ''}` : 'N/A'}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Company',
      accessor: 'company',
      render: (row) => row.company || '—',
    },
    {
      header: 'Role',
      accessor: 'role_name',
      render: (row) => <Badge status={row.role_name}>{row.role_name.replace('_', ' ')}</Badge>,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Registered',
      accessor: 'created_at',
      render: (row) => formatDate(row.created_at),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'active' ? (
            <Button variant="secondary" onClick={() => handleToggleStatus(row.id, row.status)} style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
              <UserX size={14} /> Suspend
            </Button>
          ) : (
            <Button variant="primary" onClick={() => handleToggleStatus(row.id, row.status)} style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
              <UserCheck size={14} /> Activate
            </Button>
          )}
          {row.role_name !== 'super_admin' && (
            <Button variant="danger" onClick={() => handleDelete(row.id)} style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>User & Affiliate Directory</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Manage user permissions, review account status, and perform administrative actions.
        </p>
      </div>

      <Card style={{ marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-3" style={{ flex: 1 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by name, email, or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '36px', width: '100%' }}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="form-select"
              style={{ width: '180px' }}
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="super_affiliate">Super Affiliate</option>
              <option value="affiliate">Affiliate</option>
            </select>
          </div>
          <Button type="submit">Filter Results</Button>
        </form>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={users}
          loading={loading}
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      </Card>
    </div>
  );
};
