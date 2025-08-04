# Farmacinallis Ledger

Sistema de Gestão de Matérias-Primas para Farmácias de Manipulação

---

## Descrição

Este projeto é um sistema web para controle de transações de matérias-primas em farmácias de manipulação. Permite registrar compras e vendas, visualizar saldos, editar e excluir transações de forma simples e intuitiva.

## Funcionalidades

- Cadastro de transações (compra/venda) de matérias-primas
- Listagem de transações recentes
- Busca por farmácia ou matéria-prima
- Edição inline de transações (botão de lápis)
- Exclusão de transações com confirmação (botão de lixeira)
- Cálculo automático de saldos por farmácia
- Interface responsiva e moderna

## Tecnologias Utilizadas

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) (backend e banco de dados)
- [lucide-react](https://lucide.dev/) (ícones)

## Instalação e Uso

1. **Clone o repositório:**
   ```sh
   git clone https://github.com/gabrielpagnan/farmacinallis-ledger.git
   cd farmacinallis-ledger
   ```
2. **Instale as dependências:**
   ```sh
   npm install
   ```
3. **Configure o Supabase:**
   - Crie um projeto no [Supabase](https://supabase.com/)
   - Configure as variáveis de ambiente conforme necessário (veja `.env.example` se existir)
   - Certifique-se de que a tabela `transactions` está criada conforme o modelo usado no código
4. **Rode o projeto localmente:**
   ```sh
   npm run dev
   ```
5. **Acesse no navegador:**
   - Normalmente em `http://localhost:5173`

## Estrutura Principal

- `src/pages/Dashboard.tsx`: Tela principal com cadastro, listagem, edição e exclusão de transações
- `src/components/`: Componentes reutilizáveis da interface
- `supabase/`: Configurações e integrações com o Supabase

## Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch para sua feature ou correção: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'feat: minha nova feature'`
4. Push para o seu fork: `git push origin minha-feature`
5. Abra um Pull Request neste repositório

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

Dúvidas ou sugestões? Abra uma issue ou entre em contato!
