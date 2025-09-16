# 🚀 Desafio Acessoria - API de Gerenciamento de Tarefas

Uma API RESTful desenvolvida com NestJS para gerenciamento de tarefas, usuários e funcionalidades administrativas.

## 📋 Descrição do Projeto

Esta aplicação é um sistema completo de gerenciamento de tarefas que inclui:

- **Autenticação JWT** com registro e login de usuários
- **Gerenciamento de Tarefas** com CRUD completo
- **Sistema de Tags** para categorização
- **Funcionalidades Administrativas** para gerenciar usuários
- **Dashboard com Estatísticas** personalizadas por usuário
- **Controle de Acesso** baseado em roles (USER/ADMIN)

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/eliasfmartins/desafio-acessoria.git
cd desafio-acessoria
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```env
DATABASE_URL="postgresql://postgres:docker@localhost:5432/acessoria-api?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRATION="7d"
PORT=3000
```

### 4. Inicie o banco de dados com Docker

```bash
docker-compose up -d
```

Este comando irá:
- Criar um container PostgreSQL
- Expor a porta 5432
- Criar o banco `acessoria-api`
- Configurar usuário `postgres` com senha `docker`

### 5. Execute as migrações do Prisma

```bash
npx prisma migrate dev
```

### 6. Gere o cliente Prisma

```bash
npx prisma generate
```

### 7. Popule o banco com dados de exemplo (Opcional)

```bash
npm run prisma:seed
```

Este comando criará:
- **5 usuários** (1 admin + 4 usuários regulares)
- **5 tags** predefinidas (Urgente, Importante, Desenvolvimento, Bug, Feature)
- **20 tasks** (5 para cada usuário regular)
- **Relacionamentos** entre tasks e tags

**Usuários criados:**
- `admin@acessoria.com` (ADMIN) - senha: `password123`
- `joao@acessoria.com` (USER) - senha: `password123`
- `maria@acessoria.com` (USER) - senha: `password123`
- `pedro@acessoria.com` (USER) - senha: `password123`
- `ana@acessoria.com` (USER) - senha: `password123`

## 🏃‍♂️ Como Rodar o Projeto

### Desenvolvimento

```bash
npm run start:dev
```

### Produção

```bash
npm run build
npm run start:prod
```

A aplicação estará disponível em: `http://localhost:3000`

## 🧪 Testando a API

### 1. Fazer Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acessoria.com",
    "password": "password123"
  }'
```

### 2. Listar Tasks (com token)

```bash
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### 3. Listar Usuários (admin)

```bash
curl -X GET http://localhost:3000/admin/users \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN_AQUI"
```

### 4. Ver Estatísticas

```bash
curl -X GET http://localhost:3000/stats/dashboard \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 🚀 Coleções para Testes

Para facilitar os testes, criamos coleções prontas para **Insomnia** e **Postman**:

### 📁 Arquivos Disponíveis
- **`insomnia-collection.json`** - Coleção para Insomnia
- **`postman-collection.json`** - Coleção para Postman
- **`API_COLLECTIONS.md`** - Instruções detalhadas

### 🔧 Como Importar

#### Insomnia
1. Abra o Insomnia
2. **Import** → **File** → Selecione `insomnia-collection.json`

#### Postman
1. Abra o Postman
2. **Import** → Arraste `postman-collection.json`

### ✨ Funcionalidades das Coleções
- 🔐 **Login automático** com dados do seed
- 📋 **CRUD completo** de tasks e tags
- 👑 **Funcionalidades admin** pré-configuradas
- 🧪 **Testes automáticos** de validação
- 📝 **Documentação integrada** em cada request
- 🔄 **Variáveis automáticas** (tokens, IDs)
- ⚙️ **Variáveis de ambiente** pré-configuradas
- 🚨 **Troubleshooting** completo

### 🎯 Fluxo de Teste
1. **Execute o seed**: `npm run prisma:seed`
2. **Importe a coleção** no seu cliente preferido
3. **Configure as variáveis** (se necessário)
4. **Faça login** (token salvo automaticamente)
5. **Teste todas as funcionalidades** com dados reais

### ⚙️ Variáveis de Ambiente

As coleções usam as seguintes variáveis:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `base_url` | `http://localhost:3000` | URL da API |
| `auth_token` | *(vazio)* | Token JWT (preenchido automaticamente) |
| `admin_token` | *(vazio)* | Token admin (preenchido automaticamente) |
| `user_id` | *(vazio)* | ID do usuário (preenchido automaticamente) |
| `task_id` | *(vazio)* | ID da task (preenchido automaticamente) |
| `tag_id` | *(vazio)* | ID da tag (preenchido automaticamente) |

> **💡 Dica**: Apenas `base_url` precisa ser configurada manualmente. As outras são preenchidas automaticamente pelos scripts.

**Veja `API_COLLECTIONS.md` para instruções detalhadas!**

## 📚 Documentação dos Endpoints

### 🔐 Autenticação

#### POST `/auth/register`
Registra um novo usuário no sistema.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "name": "Nome do Usuário",
  "password": "123456",
  "role": "USER" // opcional, padrão: USER
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "role": "USER"
  }
}
```

#### POST `/auth/login`
Realiza login e retorna token JWT.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "123456"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "usuario@exemplo.com",
    "name": "Nome do Usuário",
    "role": "USER"
  }
}
```

#### GET `/auth/profile`
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

### 📝 Tarefas

#### POST `/tasks`
Cria uma nova tarefa.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Título da Tarefa",
  "description": "Descrição da tarefa",
  "status": "PENDING", // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  "priority": "MEDIUM", // LOW, MEDIUM, HIGH, URGENT
  "dueDate": "2024-12-31T23:59:59.000Z" // opcional
}
```

#### GET `/tasks`
Lista tarefas do usuário com filtros e paginação.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filtrar por status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- `priority`: Filtrar por prioridade (LOW, MEDIUM, HIGH, URGENT)
- `search`: Buscar no título e descrição
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 10)

**Exemplo:**
```
GET /tasks?status=PENDING&priority=HIGH&page=1&limit=5
```

#### GET `/tasks/:id`
Busca uma tarefa específica.

**Headers:**
```
Authorization: Bearer <token>
```

#### PATCH `/tasks/:id`
Atualiza uma tarefa.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Novo Título",
  "status": "COMPLETED",
  "priority": "HIGH"
}
```

#### DELETE `/tasks/:id`
Remove uma tarefa.

**Headers:**
```
Authorization: Bearer <token>
```

### 🏷️ Tags

#### POST `/tags`
Cria uma nova tag.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Urgente",
  "color": "#FF0000"
}
```

#### GET `/tags`
Lista todas as tags disponíveis.

**Headers:**
```
Authorization: Bearer <token>
```

#### GET `/tags/:id`
Busca uma tag específica.

**Headers:**
```
Authorization: Bearer <token>
```

#### PATCH `/tags/:id`
Atualiza uma tag.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Novo Nome",
  "color": "#00FF00"
}
```

#### DELETE `/tags/:id`
Remove uma tag.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/tags/tasks/:taskId`
Adiciona uma tag a uma tarefa.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "tagId": "uuid-da-tag"
}
```

#### DELETE `/tags/tasks/:taskId/:tagId`
Remove uma tag de uma tarefa.

**Headers:**
```
Authorization: Bearer <token>
```

### 👑 Funcionalidades Administrativas

> **⚠️ Apenas usuários com role ADMIN podem acessar estas rotas**

#### GET `/admin/users`
Lista todos os usuários do sistema.

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### GET `/admin/tasks`
Lista todas as tarefas do sistema.

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### PATCH `/admin/users/:id/role`
Altera o role de um usuário.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Body:**
```json
{
  "role": "ADMIN" // ou "USER"
}
```

#### DELETE `/admin/users/:id`
Remove um usuário do sistema. **⚠️ ATENÇÃO: Esta ação também remove todas as tasks do usuário.**

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "message": "Usuário deletado com sucesso",
  "deletedTasks": 5
}
```

### 📊 Estatísticas

#### GET `/stats/dashboard`
Retorna estatísticas personalizadas do usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta (Usuário Regular):**
```json
{
  "totalTasks": 5,
  "tasksByStatus": {
    "PENDING": 2,
    "IN_PROGRESS": 1,
    "COMPLETED": 1,
    "CANCELLED": 1
  },
  "tasksByPriority": {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 2,
    "URGENT": 0
  },
  "overdueTasks": 0,
  "completionRate": 20.0
}
```

**Resposta (Admin - com estatísticas globais):**
```json
{
  "totalTasks": 5,
  "tasksByStatus": {
    "PENDING": 2,
    "IN_PROGRESS": 1,
    "COMPLETED": 1,
    "CANCELLED": 1
  },
  "tasksByPriority": {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 2,
    "URGENT": 0
  },
  "overdueTasks": 0,
  "completionRate": 20.0,
  "adminStats": {
    "totalTasks": 21,
    "tasksByStatus": {
      "PENDING": 8,
    "IN_PROGRESS": 5,
    "COMPLETED": 5,
    "CANCELLED": 3
  },
  "tasksByPriority": {
    "LOW": 3,
    "MEDIUM": 8,
    "HIGH": 8,
    "URGENT": 2
  },
  "overdueTasks": 2,
  "completionRate": 23.8
}
```

> **💡 Nota**: Usuários ADMIN recebem um campo adicional `adminStats` com estatísticas de todos os usuários do sistema, permitindo controle total e visão geral.

## 🔒 Autenticação e Autorização

### Como obter um token:

1. **Registre-se** ou **faça login** usando `/auth/register` ou `/auth/login`
2. **Copie o token** da resposta (campo `access_token`)
3. **Use o token** no header `Authorization: Bearer <token>`

### Roles do Sistema:

- **USER**: Usuário comum, pode gerenciar suas próprias tarefas
- **ADMIN**: Administrador, pode acessar todas as funcionalidades administrativas

### Regras Especiais:

- O **primeiro usuário** registrado no sistema é automaticamente **ADMIN**
- Usuários só podem ver/editar/deletar suas próprias tarefas
- Apenas **ADMINs** podem acessar rotas `/admin/*`

## 🗄️ Banco de Dados

### Estrutura:

- **Users**: Usuários do sistema
- **Tasks**: Tarefas dos usuários
- **Tags**: Tags para categorização
- **Relacionamentos**: User → Tasks (1:N), Tasks → Tags (N:N)

### Comandos úteis:

```bash
# Visualizar banco no Prisma Studio
npx prisma studio

# Resetar banco de dados
npx prisma migrate reset

# Aplicar migrações
npx prisma migrate dev
```

## 🧪 Testando a API

### Usando Insomnia/Postman:

1. **Configure a base URL**: `http://localhost:3000`
2. **Faça login** para obter o token
3. **Configure o header**: `Authorization: Bearer <seu-token>`
4. **Teste os endpoints** conforme a documentação

### Exemplo de fluxo completo:

1. `POST /auth/register` → Obter token
2. `POST /tasks` → Criar tarefa
3. `GET /tasks` → Listar tarefas
4. `GET /stats/dashboard` → Ver estatísticas

## 🐳 Docker

### Comandos Docker:

```bash
# Iniciar banco de dados
docker-compose up -d

# Parar banco de dados
docker-compose down

# Ver logs do container
docker-compose logs postgres

# Acessar banco via CLI
docker exec -it acessoria-api psql -U postgres -d acessoria-api
```

## 🚨 Troubleshooting

### Problemas comuns:

1. **Erro de conexão com banco**:
   - Verifique se o Docker está rodando
   - Execute `docker-compose up -d`

2. **Token inválido**:
   - Faça login novamente para obter um token fresco
   - Verifique se o token está no header correto

3. **Erro 401 Unauthorized**:
   - Verifique se o token está correto
   - Para rotas admin, certifique-se de que o usuário é ADMIN

4. **Erro de validação**:
   - Verifique se todos os campos obrigatórios estão preenchidos
   - Consulte a documentação dos DTOs

## 📝 Scripts Disponíveis

```bash
npm run start:dev    # Desenvolvimento com hot-reload
npm run build        # Compilar para produção
npm run start:prod   # Executar em produção
npm run test         # Executar testes
npm run lint         # Verificar código
npm run prisma:seed  # Popular banco com dados de exemplo
```

### 🌱 Script de Seed

O comando `npm run prisma:seed` é muito útil para:

- **Desenvolvimento**: Ter dados de teste prontos
- **Demonstração**: Mostrar a API funcionando com dados reais
- **Testes**: Validar funcionalidades com diferentes cenários

**Dados criados pelo seed:**
- ✅ 1 usuário administrador
- ✅ 4 usuários regulares
- ✅ 5 tags coloridas
- ✅ 20 tasks com diferentes status
- ✅ Relacionamentos entre tasks e tags

**Para limpar e recriar os dados:**
```bash
# O seed automaticamente limpa os dados existentes antes de criar novos
npm run prisma:seed
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ usando NestJS**