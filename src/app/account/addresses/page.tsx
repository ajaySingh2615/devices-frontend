"use client";

import { useEffect, useState } from "react";
import {
  addressApi,
  AddressDto,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-hot-toast";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<AddressDto | null>(null);
  const [form, setForm] = useState<CreateAddressRequest>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isDefault: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await addressApi.list();
      setAddresses(data);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      isDefault: false,
    });
  };

  const onSubmit = async () => {
    try {
      if (
        !form.name ||
        !form.line1 ||
        !form.city ||
        !form.state ||
        !form.country ||
        !form.pincode
      ) {
        toast.error("Please fill all required fields");
        return;
      }
      if (!/^[0-9]{6}$/.test(form.pincode)) {
        toast.error("Invalid PIN code");
        return;
      }
      if (editing) {
        const payload: UpdateAddressRequest = { ...form };
        const res = await addressApi.update(editing.id, payload);
        toast.success("Address updated");
      } else {
        const payload: CreateAddressRequest = { ...form };
        const res = await addressApi.create(payload);
        toast.success("Address added");
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save address");
    }
  };

  const onEdit = (a: AddressDto) => {
    setEditing(a);
    setForm({
      name: a.name,
      phone: a.phone || "",
      line1: a.line1,
      line2: a.line2 || "",
      city: a.city,
      state: a.state,
      country: a.country,
      pincode: a.pincode,
      isDefault: a.isDefault,
    });
    setShowForm(true);
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await addressApi.remove(id);
      toast.success("Address deleted");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const onMakeDefault = async (id: string) => {
    try {
      await addressApi.makeDefault(id);
      toast.success("Default address updated");
      load();
    } catch (e: any) {
      toast.error(e?.message || "Operation failed");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">My Addresses</h1>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          Add Address
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? "Edit Address" : "Add Address"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address Line 1</Label>
                <Input
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address Line 2 (optional)</Label>
                <Input
                  value={form.line2}
                  onChange={(e) => setForm({ ...form, line2: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div>
                <Label>State</Label>
                <Input
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={form.country}
                  onChange={(e) =>
                    setForm({ ...form, country: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>PIN Code</Label>
                <Input
                  value={form.pincode}
                  onChange={(e) =>
                    setForm({ ...form, pincode: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input
                id="isDefault"
                type="checkbox"
                checked={!!form.isDefault}
                onChange={(e) =>
                  setForm({ ...form, isDefault: e.target.checked })
                }
              />
              <Label htmlFor="isDefault">Set as default</Label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={onSubmit}>{editing ? "Update" : "Save"}</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{a.name}</CardTitle>
                {a.isDefault && <Badge>Default</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <div>{a.line1}</div>
                {a.line2 && <div>{a.line2}</div>}
                <div>
                  {a.city}, {a.state}
                </div>
                <div>
                  {a.country} - {a.pincode}
                </div>
                {a.phone && <div>Phone: {a.phone}</div>}
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => onEdit(a)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(a.id)}
                >
                  Delete
                </Button>
                {!a.isDefault && (
                  <Button size="sm" onClick={() => onMakeDefault(a.id)}>
                    Make Default
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
