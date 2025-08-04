import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const Historico = () => {
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error) setTransactions(data || []);
  };

  const handleEditClick = (transaction) => {
    setEditingId(transaction.id);
    setEditForm({ ...transaction });
  };

  function handleEditFormChange(field, value) {
    let newEditForm = { ...editForm, [field]: value };
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(field === 'quantity' ? value : newEditForm.quantity);
      const u = parseFloat(field === 'unit_price' ? value : newEditForm.unit_price);
      if (!isNaN(q) && !isNaN(u)) {
        newEditForm.total_value = (q * u).toFixed(2);
      }
    } else if (field === 'total_value') {
      const q = parseFloat(newEditForm.quantity);
      const t = parseFloat(value);
      if (!isNaN(q) && q !== 0 && !isNaN(t)) {
        newEditForm.unit_price = (t / q).toFixed(2);
      }
    }
    setEditForm(newEditForm);
  }

  const handleEditSave = async () => {
    const total_value = editForm.total_value ? parseFloat(editForm.total_value) : (parseFloat(editForm.quantity) * parseFloat(editForm.unit_price));
    const { error } = await supabase
      .from('transactions')
      .update({
        ...editForm,
        quantity: parseFloat(editForm.quantity),
        unit_price: parseFloat(editForm.unit_price),
        total_value,
      })
      .eq('id', editingId);
    if (!error) {
      setEditingId(null);
      setEditForm({});
      fetchTransactions();
      toast({ title: 'Transação atualizada com sucesso!' });
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDeleteTransaction = async (id) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      fetchTransactions();
      toast({ title: 'Transação excluída com sucesso!' });
    }
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.pharmacy_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.raw_material_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Histórico de Transações</h2>
      <Card className="farmacinallis-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por farmácia ou matéria-prima..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {searchTerm ? 'Nenhuma transação encontrada' : 'Nenhuma transação registrada ainda'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((transaction) => (
                editingId === transaction.id ? (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg bg-accent/30">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          className="font-medium border rounded px-2 py-1 text-sm"
                          name="pharmacy_name"
                          value={editForm.pharmacy_name}
                          onChange={e => handleEditFormChange('pharmacy_name', e.target.value)}
                        />
                      </div>
                      <input
                        className="text-sm text-muted-foreground border rounded px-2 py-1"
                        name="raw_material_name"
                        value={editForm.raw_material_name}
                        onChange={e => handleEditFormChange('raw_material_name', e.target.value)}
                      />
                      <input
                        className="text-xs text-muted-foreground border rounded px-2 py-1 w-24"
                        name="transaction_date"
                        type="date"
                        value={editForm.transaction_date instanceof Date ? format(editForm.transaction_date, 'yyyy-MM-dd') : editForm.transaction_date}
                        onChange={e => handleEditFormChange('transaction_date', e.target.value)}
                      />
                      <div className="flex gap-2">
                        <input
                          className="text-xs text-muted-foreground border rounded px-2 py-1 w-24"
                          name="quantity"
                          type="number"
                          step="0.001"
                          value={editForm.quantity}
                          onChange={e => handleEditFormChange('quantity', e.target.value)}
                          placeholder="Quantidade (g)"
                        />
                        <input
                          className="text-xs text-muted-foreground border rounded px-2 py-1 w-24"
                          name="unit_price"
                          type="number"
                          step="0.01"
                          value={editForm.unit_price}
                          onChange={e => handleEditFormChange('unit_price', e.target.value)}
                          placeholder="Valor"
                        />
                        <input
                          className="text-xs text-muted-foreground border rounded px-2 py-1 w-24"
                          name="total_value"
                          type="number"
                          step="0.01"
                          value={editForm.total_value}
                          onChange={e => handleEditFormChange('total_value', e.target.value)}
                          placeholder="Valor total"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-2">
                      <Button size="sm" onClick={handleEditSave} className="bg-green-600 text-white">Salvar</Button>
                      <Button size="sm" variant="secondary" onClick={handleEditCancel}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            transaction.transaction_type === 'compra'
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          )}
                        >
                          {transaction.transaction_type === 'compra' ? 'Compra' : 'Venda'}
                        </span>
                        <span className="font-medium">{transaction.pharmacy_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.raw_material_name} • {transaction.quantity} unidades
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.transaction_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-bold">R$ {Number(transaction.total_value).toFixed(2)} <span className="text-xs font-normal">(total)</span></p>
                        <p className="text-xs text-muted-foreground">
                          R$ {Number(transaction.unit_price).toFixed(2)}/{transaction.raw_material_name?.toLowerCase().includes('grama') ? 'gr' : 'un'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        title="Editar transação"
                        onClick={() => handleEditClick(transaction)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="ml-2"
                        title="Excluir transação"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Historico;