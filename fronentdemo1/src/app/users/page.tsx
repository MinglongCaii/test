"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "@/lib/api";
import type { User } from "@/lib/api";
import Modal from "@/components/Modal";
import UserForm, { UserFormValues } from "@/components/UserForm";

export default function UsersPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  const loadUsers = useCallback(async (name = "") => {
    setListLoading(true);
    setListError("");
    try {
      setUsers(await getUsers(name));
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadUsers();
  }, [isAuthenticated, loadUsers]);

  const closeModals = () => {
    setShowCreate(false);
    setEditTarget(null);
    setDeleteTarget(null);
    setActionError("");
  };

  const handleCreate = async (values: UserFormValues) => {
    setActionError("");
    try {
      await createUser(values.name, values.email, values.password);
      closeModals();
      loadUsers(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const handleUpdate = async (values: UserFormValues) => {
    setActionError("");
    try {
      await updateUser({
        name: values.name,
        email: values.email,
        ...(values.password ? { password: values.password } : {}),
      });
      closeModals();
      loadUsers(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionError("");
    try {
      await deleteUser(deleteTarget.id);
      closeModals();
      loadUsers(search);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(search);
  };

  if (isLoading) return <p className="text-center mt-10">Loading...</p>;
  if (!isAuthenticated) return null;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={() => {
            setActionError("");
            setShowCreate(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name..."
          className="border border-gray-300 rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              loadUsers("");
            }}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>

      {listError && <p className="text-red-500 mb-4">{listError}</p>}

      {listLoading ? (
        <p className="text-center mt-10">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-center mt-10 text-gray-500">No users found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-gray-600 text-sm">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === user?.id;
                return (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-3">{u.id}</td>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => {
                          setActionError("");
                          setEditTarget(u);
                        }}
                        disabled={!isSelf}
                        title={
                          isSelf
                            ? "Edit your account"
                            : "Backend only allows updating your own account"
                        }
                        className="text-blue-600 hover:underline disabled:text-gray-300 disabled:no-underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setActionError("");
                          setDeleteTarget(u);
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <Modal title="Create User" onClose={closeModals}>
          <UserForm
            mode="create"
            onSubmit={handleCreate}
            onCancel={closeModals}
            error={actionError}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal title={`Edit User #${editTarget.id}`} onClose={closeModals}>
          <UserForm
            mode="edit"
            initial={{ name: editTarget.name, email: editTarget.email }}
            onSubmit={handleUpdate}
            onCancel={closeModals}
            error={actionError}
          />
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete User" onClose={closeModals}>
          <p className="text-gray-700">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget.name}</strong> (ID {deleteTarget.id})?
          </p>
          {actionError && (
            <p className="text-red-500 text-sm mt-2">{actionError}</p>
          )}
          <div className="flex gap-2 justify-end mt-6">
            <button
              onClick={closeModals}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
