import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const RegisterTransaction = ({ formData, setFormData, handleFormDataChange, handleSubmit, isLoading, isDatePickerOpen, setIsDatePickerOpen, totalValue }) => (
  <div className="farmacinallis-shadow mb-6">
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data */}
        <div className="space-y-2">
          <Label>Data da Transação</Label>
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={
                  !formData.transaction_date ? 'text-muted-foreground' : ''
                }
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.transaction_date ? (
                  format(formData.transaction_date, 'PPP', { locale: ptBR })
                ) : (
                  'Selecione a data'
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
                  date > new Date() || date < new Date('1900-01-01')
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
            onValueChange={(value) =>
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
            placeholder="Quantidade"
            value={formData.quantity}
            onChange={e => handleFormDataChange('quantity', e.target.value)}
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
            placeholder="Valor unitário"
            value={formData.unit_price}
            onChange={e => handleFormDataChange('unit_price', e.target.value)}
            required
          />
        </div>
        {/* Valor Total */}
        <div className="space-y-2">
          <Label htmlFor="total_value">Valor Total</Label>
          <Input
            id="total_value"
            type="number"
            step="0.01"
            placeholder="Valor total"
            value={formData.total_value}
            onChange={e => handleFormDataChange('total_value', e.target.value)}
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
  </div>
);

export default RegisterTransaction;