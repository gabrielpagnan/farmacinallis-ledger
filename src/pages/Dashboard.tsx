import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Plus, Search, TrendingUp, TrendingDown, Trash, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  pharmacy_name: string;
  raw_material_name: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface PharmacyBalance {
  pharmacy_name: string;
  balance: number;
  transactions_count: number;
}

const Dashboard = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pharmacyBalances, setPharmacyBalances] = useState<PharmacyBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    transaction_date: new Date(),
    transaction_type: '' as 'compra' | 'venda' | '',
    pharmacy_name: '',
    raw_material_name: '',
    quantity: '',
    unit_price: '',
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    fetchTransactions();
    calculatePharmacyBalances();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar transações",
        description: error.message,
      });
    }
  };

  const calculatePharmacyBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*');

      if (error) throw error;

      const balanceMap = new Map<string, { balance: number; count: number }>();

      data?.forEach(transaction => {
        const current = balanceMap.get(transaction.pharmacy_name) || { balance: 0, count: 0 };
        
        // Compra = valor negativo (eu devo), Venda = valor positivo (ela me deve)
        const amount = transaction.transaction_type === 'compra' 
          ? -transaction.total_value 
          : transaction.total_value;
        
        balanceMap.set(transaction.pharmacy_name, {
          balance: current.balance + amount,
          count: current.count + 1
        });
      });

      const balances: PharmacyBalance[] = Array.from(balanceMap.entries()).map(
        ([pharmacy_name, { balance, count }]) => ({
          pharmacy_name,
          balance,
          transactions_count: count
        })
      );

      setPharmacyBalances(balances);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao calcular saldos",
        description: error.message,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const total_value = parseFloat(formData.quantity) * parseFloat(formData.unit_price);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            transaction_date: format(formData.transaction_date, 'yyyy-MM-dd'),
            transaction_type: formData.transaction_type,
            pharmacy_name: formData.pharmacy_name.trim(),
            raw_material_name: formData.raw_material_name.trim(),
            quantity: parseFloat(formData.quantity),
            unit_price: parseFloat(formData.unit_price),
            total_value,
            user_id: user.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Transação registrada com sucesso!",
        description: `${formData.transaction_type === 'compra' ? 'Compra' : 'Venda'} de ${formData.raw_material_name}`,
      });

      // Reset form
      setFormData({
        transaction_date: new Date(),
        transaction_type: '',
        pharmacy_name: '',
        raw_material_name: '',
        quantity: '',
        unit_price: '',
      });

      // Refresh data
      fetchTransactions();
      calculatePharmacyBalances();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao registrar transação",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const confirmed = window.confirm('Tem certeza que deseja excluir esta transação?');
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({
        title: 'Transação excluída com sucesso!',
      });
      fetchTransactions();
      calculatePharmacyBalances();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir transação',
        description: error.message,
      });
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      ...transaction,
      transaction_date: transaction.transaction_date ? new Date(transaction.transaction_date) : new Date(),
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          ...editForm,
          transaction_date: editForm.transaction_date instanceof Date ? format(editForm.transaction_date, 'yyyy-MM-dd') : editForm.transaction_date,
          quantity: parseFloat(editForm.quantity),
          unit_price: parseFloat(editForm.unit_price),
          total_value: parseFloat(editForm.unit_price),
        })
        .eq('id', editingId);
      if (error) throw error;
      toast({ title: 'Transação atualizada com sucesso!' });
      setEditingId(null);
      setEditForm(null);
      fetchTransactions();
      calculatePharmacyBalances();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar transação',
        description: error.message,
      });
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const filteredTransactions = transactions.filter(transaction =>
    transaction.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.raw_material_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = formData.quantity && formData.unit_price 
    ? parseFloat(formData.quantity) * parseFloat(formData.unit_price) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Saldos por Farmácia */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-primary">Saldos por Farmácia</h2>
        {pharmacyBalances.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Nenhuma transação registrada ainda</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pharmacyBalances.map((pharmacy) => (
              <Card key={pharmacy.pharmacy_name} className="farmacinallis-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{pharmacy.pharmacy_name}</CardTitle>
                  <CardDescription>
                    {pharmacy.transactions_count} transação{pharmacy.transactions_count !== 1 ? 'ões' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "flex items-center space-x-2 text-lg font-bold",
                    pharmacy.balance > 0 ? "text-green-600" : pharmacy.balance < 0 ? "text-red-600" : "text-muted-foreground"
                  )}>
                    {pharmacy.balance > 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : pharmacy.balance < 0 ? (
                      <TrendingDown className="w-5 h-5" />
                    ) : null}
                    <span>R$ {Math.abs(pharmacy.balance).toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pharmacy.balance > 0 
                      ? `A farmácia ${pharmacy.pharmacy_name} deve para você`
                      : pharmacy.balance < 0 
                      ? `Você deve para ${pharmacy.pharmacy_name}`
                      : 'Saldo zerado'
                    }
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Formulário de Registro */}
      <Card className="farmacinallis-shadow">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Registrar Nova Transação</span>
          </CardTitle>
          <CardDescription>
            Registre compras e vendas de matérias-primas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data */}
              <div className="space-y-2">
                <Label>Data da Transação</Label>
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.transaction_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.transaction_date ? (
                        format(formData.transaction_date, "PPP", { locale: ptBR })
                      ) : (
                        "Selecione a data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.transaction_date}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, transaction_date: date });
                          setIsDatePickerOpen(false);
                        }
                      }}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo de Transação */}
              <div className="space-y-2">
                <Label>Tipo de Transação</Label>
                <Select
                  value={formData.transaction_type}
                  onValueChange={(value: 'compra' | 'venda') =>
                    setFormData({ ...formData, transaction_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compra">Compra (Eu devo)</SelectItem>
                    <SelectItem value="venda">Venda (Eles devem)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nome da Farmácia */}
              <div className="space-y-2">
                <Label htmlFor="pharmacy_name">Nome da Farmácia</Label>
                <Input
                  id="pharmacy_name"
                  placeholder="Nome da farmácia"
                  value={formData.pharmacy_name}
                  onChange={(e) =>
                    setFormData({ ...formData, pharmacy_name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Nome da Matéria-Prima */}
              <div className="space-y-2">
                <Label htmlFor="raw_material_name">Matéria-Prima</Label>
                <Input
                  id="raw_material_name"
                  placeholder="Nome da matéria-prima"
                  value={formData.raw_material_name}
                  onChange={(e) =>
                    setFormData({ ...formData, raw_material_name: e.target.value })
                  }
                  required
                />
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade (g)</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData({ ...formData, quantity: e.target.value })
                  }
                  required
                />
              </div>

              {/* Valor */}
              <div className="space-y-2">
                <Label htmlFor="unit_price">Valor</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.unit_price}
                  onChange={(e) =>
                    setFormData({ ...formData, unit_price: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* Valor Total */}
            {totalValue > 0 && (
              <div className="p-4 bg-accent rounded-lg">
                <p className="text-lg font-bold text-center">
                  Valor Total: R$ {totalValue.toFixed(2)}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full farmacinallis-gradient" 
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Registrar Transação'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Transações Recentes */}
      <Card className="farmacinallis-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transações Recentes</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por farmácia ou matéria-prima..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredTransactions.slice(0, 10).map((transaction) => (
                editingId === transaction.id ? (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg bg-accent/30">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          editForm.transaction_type === 'compra'
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                        )}>
                          {editForm.transaction_type === 'compra' ? 'Compra' : 'Venda'}
                        </span>
                        <input
                          className="font-medium border rounded px-2 py-1 text-sm"
                          name="pharmacy_name"
                          value={editForm.pharmacy_name}
                          onChange={handleEditChange}
                        />
                      </div>
                      <input
                        className="text-sm text-muted-foreground border rounded px-2 py-1"
                        name="raw_material_name"
                        value={editForm.raw_material_name}
                        onChange={handleEditChange}
                      />
                      <input
                        className="text-xs text-muted-foreground border rounded px-2 py-1"
                        name="transaction_date"
                        type="date"
                        value={editForm.transaction_date instanceof Date ? format(editForm.transaction_date, 'yyyy-MM-dd') : editForm.transaction_date}
                        onChange={handleEditChange}
                      />
                      <div className="flex gap-2">
                        <input
                          className="text-xs text-muted-foreground border rounded px-2 py-1 w-24"
                          name="quantity"
                          type="number"
                          step="0.001"
                          value={editForm.quantity}
                          onChange={handleEditChange}
                          placeholder="Quantidade (g)"
                        />
                        <input
                          className="text-xs text-muted-foreground border rounded px-2 py-1 w-24"
                          name="unit_price"
                          type="number"
                          step="0.01"
                          value={editForm.unit_price}
                          onChange={handleEditChange}
                          placeholder="Valor"
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
                        <p className="font-bold">R$ {transaction.total_value.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {transaction.unit_price.toFixed(2)}/un
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

export default Dashboard;