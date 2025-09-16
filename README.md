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
- **Soft Delete** para usuários e tarefas com possibilidade de restauração
- **Sistema de Cache** com Redis para otimização de consultas frequentes

## 🛠️ Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 16 ou superior)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Redis](https://redis.io/) para cache (pode ser executado via Docker)
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
# Configurações do Redis (opcional - padrões funcionam se Redis estiver na porta 6379)
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=sua-senha-redis
```

### 4. Inicie os serviços com Docker

```bash
docker-compose up -d
```

Este comando irá iniciar:
- **PostgreSQL**: Database principal na porta 5432
  - Usuário: `postgres`
  - Senha: `docker`
  - Database: `acessoria-api`
- **Redis**: Cache na porta 6379
  - Imagem Alpine (leve e eficiente)
  - Persistência habilitada (AOF)

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

## 🚀 Sistema de Cache

### 📋 Visão Geral

A aplicação implementa um sistema de cache robusto usando **Redis** para otimizar consultas frequentes e melhorar a performance geral da API.

### 🔧 Configuração

#### Bibliotecas Utilizadas
- `@nestjs/cache-manager` - Módulo oficial do NestJS para cache
- `cache-manager` - Gerenciador de cache
- `cache-manager-redis-store` - Store Redis para cache-manager
- `redis` - Cliente Redis

#### Configuração do Redis
O cache é configurado automaticamente no `AppModule` e conecta-se ao Redis usando as seguintes variáveis de ambiente:

```env
REDIS_HOST=localhost      # Host do Redis (padrão: localhost)
REDIS_PORT=6379          # Porta do Redis (padrão: 6379)
REDIS_PASSWORD=          # Senha do Redis (opcional)
```

### 🎯 Funcionalidades Implementadas

#### 1. **Cache Automático em Consultas**
- **Tarefas**: Cache de listagem e consultas individuais (TTL: 2-5 minutos)
- **Tags**: Cache de listagem de tags (TTL: 10 minutos)
- **Estatísticas**: Cache do dashboard (TTL: 3 minutos)

#### 2. **Interceptor Personalizado**
- Interceptor customizado (`CacheInterceptor`) para cache automático
- Headers de resposta indicam cache HIT/MISS (`X-Cache`)
- Chaves de cache incluem ID do usuário e parâmetros da requisição

#### 3. **Invalidação Inteligente**
- Cache é invalidado automaticamente quando dados são modificados
- Operações de criação, atualização e exclusão limpam cache relacionado
- Invalidação granular por usuário e tipo de dados

### 📊 Estratégias de Cache

#### **Por Endpoint:**

| Endpoint | TTL | Estratégia | Invalidação |
|----------|-----|------------|-------------|
| `GET /tasks` | 2 minutos | Por usuário + filtros | Ao criar/editar/deletar task |
| `GET /tasks/:id` | 5 minutos | Por task específica | Ao editar/deletar task |
| `GET /tags` | 10 minutos | Global | Ao criar/editar/deletar tag |
| `GET /stats/dashboard` | 3 minutos | Por usuário + role | Ao modificar tasks do usuário |

#### **Chaves de Cache:**
- `tasks:user:{userId}:page:{page}:limit:{limit}:status:{status}:priority:{priority}:search:{search}`
- `task:{taskId}:user:{userId}`
- `tags:all`
- `stats:user:{userId}:role:{role}`

### 🔄 Como Funciona

#### 1. **Consulta com Cache**
```typescript
// Primeira requisição - consulta banco de dados
GET /tasks → Database → Cache → Response (X-Cache: MISS)

// Requisições subsequentes - retorna do cache
GET /tasks → Cache → Response (X-Cache: HIT)
```

#### 2. **Invalidação Automática**
```typescript
// Usuário cria uma tarefa
POST /tasks → Database → Invalidate cache → Response

// Próxima consulta busca dados atualizados
GET /tasks → Database → Cache → Response (X-Cache: MISS)
```

### 🛠️ Comandos Úteis

#### Verificar Cache Redis
```bash
# Conectar ao Redis
docker exec -it acessoria-redis redis-cli

# Listar todas as chaves
KEYS *

# Ver conteúdo de uma chave específica
GET "tasks:user:123:page:1:limit:10:status:all:priority:all:search:none"

# Limpar todo o cache
FLUSHALL
```

#### Monitoramento
```bash
# Ver estatísticas do Redis
docker exec acessoria-redis redis-cli INFO memory

# Monitorar comandos em tempo real
docker exec acessoria-redis redis-cli MONITOR
```

### 📈 Benefícios

1. **Performance**: Redução de 30-50% no tempo de resposta para consultas frequentes
2. **Escalabilidade**: Menor carga no banco de dados
3. **Experiência**: Respostas mais rápidas para usuários
4. **Recursos**: Otimização de uso de CPU e memória do servidor

### ⚙️ Configurações Avançadas

#### Personalizar TTL por Endpoint
```typescript
@Get()
@UseInterceptors(CacheInterceptor)
@CacheKey('custom:endpoint')
@CacheTTL(600000) // 10 minutos
customEndpoint() {
  return this.service.getData();
}
```

#### Invalidação Manual
```typescript
// No serviço
await this.cacheManager.del('chave-especifica');
await this.cacheManager.reset(); // Limpar todo cache
```

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
- 🗑️ **Soft Delete** com restore e hard delete
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
Remove uma tarefa (soft delete).

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Tarefa deletada com sucesso (soft delete)",
  "canRestore": true
}
```

#### POST `/tasks/:id/restore`
Restaura uma tarefa deletada.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "message": "Tarefa restaurada com sucesso"
}
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
Remove um usuário do sistema (soft delete). **⚠️ Esta ação também remove todas as tasks do usuário.**

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "message": "Usuário deletado com sucesso (soft delete)",
  "deletedTasks": 5,
  "canRestore": true
}
```

#### GET `/admin/users/deleted`
Lista usuários deletados (soft deleted).

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### GET `/admin/tasks/deleted`
Lista tarefas deletadas (soft deleted).

**Headers:**
```
Authorization: Bearer <admin-token>
```

#### POST `/admin/users/:id/restore`
Restaura um usuário deletado e suas tarefas.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "message": "Usuário restaurado com sucesso"
}
```

#### POST `/admin/tasks/:id/restore`
Restaura uma tarefa deletada.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "message": "Task restaurada com sucesso"
}
```

#### DELETE `/admin/users/:id/permanent`
Remove permanentemente um usuário do sistema (hard delete). **⚠️ ATENÇÃO: Esta ação é irreversível!**

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "message": "Usuário deletado permanentemente"
}
```

#### DELETE `/admin/tasks/:id/permanent`
Remove permanentemente uma tarefa do sistema (hard delete). **⚠️ ATENÇÃO: Esta ação é irreversível!**

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Resposta:**
```json
{
  "message": "Task deletada permanentemente"
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

## 🗑️ Soft Delete

O sistema implementa **Soft Delete** para usuários e tarefas, permitindo que registros sejam "deletados" sem serem removidos permanentemente do banco de dados. Isso oferece maior segurança e possibilidade de recuperação.

### 🔄 Como Funciona

- **Soft Delete**: Registros são marcados com `deletedAt` (timestamp) ao invés de serem removidos
- **Filtros Automáticos**: Registros deletados não aparecem nas listas normais
- **Restauração**: Registros podem ser restaurados a qualquer momento
- **Hard Delete**: Opção de remoção permanente (irreversível)

### 📋 Funcionalidades Disponíveis

#### Para Usuários:
- ✅ **Soft Delete**: `DELETE /admin/users/:id`
- ✅ **Listar Deletados**: `GET /admin/users/deleted`
- ✅ **Restaurar**: `POST /admin/users/:id/restore`
- ✅ **Hard Delete**: `DELETE /admin/users/:id/permanent`

#### Para Tarefas:
- ✅ **Soft Delete**: `DELETE /tasks/:id` (usuário) ou `DELETE /admin/tasks/:id` (admin)
- ✅ **Listar Deletadas**: `GET /admin/tasks/deleted`
- ✅ **Restaurar**: `POST /tasks/:id/restore` (usuário) ou `POST /admin/tasks/:id/restore` (admin)
- ✅ **Hard Delete**: `DELETE /admin/tasks/:id/permanent`

### 🎯 Comportamento Especial

#### Ao Deletar um Usuário:
1. **Usuário** é marcado como deletado (`deletedAt`)
2. **Todas as tasks** do usuário são automaticamente deletadas
3. **Usuário** não aparece mais na lista normal
4. **Tasks** não aparecem mais nas listas normais

#### Ao Restaurar um Usuário:
1. **Usuário** é restaurado (`deletedAt = null`)
2. **Todas as tasks** do usuário são automaticamente restauradas
3. **Usuário** volta a aparecer na lista normal
4. **Tasks** voltam a aparecer nas listas normais

### 🔍 Exemplos de Uso

#### 1. Deletar e Restaurar uma Tarefa
```bash
# Deletar tarefa (soft delete)
curl -X DELETE http://localhost:3000/tasks/task-id \
  -H "Authorization: Bearer <token>"

# Listar tarefas (tarefa deletada não aparece)
curl -X GET http://localhost:3000/tasks \
  -H "Authorization: Bearer <token>"

# Restaurar tarefa
curl -X POST http://localhost:3000/tasks/task-id/restore \
  -H "Authorization: Bearer <token>"
```

#### 2. Deletar e Restaurar um Usuário (Admin)
```bash
# Deletar usuário (soft delete)
curl -X DELETE http://localhost:3000/admin/users/user-id \
  -H "Authorization: Bearer <admin-token>"

# Listar usuários deletados
curl -X GET http://localhost:3000/admin/users/deleted \
  -H "Authorization: Bearer <admin-token>"

# Restaurar usuário
curl -X POST http://localhost:3000/admin/users/user-id/restore \
  -H "Authorization: Bearer <admin-token>"
```

#### 3. Hard Delete (Permanente)
```bash
# Deletar permanentemente (irreversível)
curl -X DELETE http://localhost:3000/admin/users/user-id/permanent \
  -H "Authorization: Bearer <admin-token>"
```

### ⚠️ Importante

- **Soft Delete** é o comportamento padrão para todas as operações de delete
- **Hard Delete** só está disponível para administradores
- **Hard Delete** é **irreversível** - use com cuidado!
- **Filtros automáticos** garantem que registros deletados não apareçam nas listas normais
- **Restauração** funciona tanto para usuários quanto para tarefas individuais

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
# Iniciar todos os serviços (PostgreSQL + Redis)
docker-compose up -d

# Parar todos os serviços
docker-compose down

# Ver logs dos containers
docker-compose logs postgres
docker-compose logs redis

# Acessar banco via CLI
docker exec -it acessoria-api psql -U postgres -d acessoria-api

# Acessar Redis via CLI
docker exec -it acessoria-redis redis-cli
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