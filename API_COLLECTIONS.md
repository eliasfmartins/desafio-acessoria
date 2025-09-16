# 🚀 Coleções da API - Insomnia e Postman

Este diretório contém coleções prontas para testar a API Acessoria nos principais clientes HTTP.

## 📁 Arquivos Disponíveis

- **`insomnia-collection.json`** - Coleção para Insomnia
- **`postman-collection.json`** - Coleção para Postman
- **`API_COLLECTIONS.md`** - Este arquivo de instruções

## 🔧 Como Importar

### Insomnia
1. Abra o Insomnia
2. Clique em **"Create"** → **"Import From"** → **"File"**
3. Selecione o arquivo `insomnia-collection.json`
4. A coleção será importada com todas as pastas e requests

### Postman
1. Abra o Postman
2. Clique em **"Import"**
3. Arraste o arquivo `postman-collection.json` ou selecione via **"Upload Files"**
4. A coleção será importada com todas as pastas e requests

## 🎯 Como Usar

### 0. Configuração Inicial (IMPORTANTE!)

Antes de usar as coleções, certifique-se de que:

1. **API está rodando**:
   ```bash
   npm run start:dev
   ```

2. **Banco está configurado**:
   ```bash
   docker-compose up -d
   npx prisma migrate dev
   npx prisma generate
   ```

3. **Dados de exemplo estão carregados**:
   ```bash
   npm run prisma:seed
   ```

4. **API está respondendo**:
   - Acesse `http://localhost:3000` no navegador
   - Deve retornar uma mensagem de boas-vindas

### 1. Configurar Variáveis de Ambiente

#### Insomnia
- Vá em **"Manage Environments"**
- Edite o ambiente **"Base Environment"**
- Configure as seguintes variáveis:

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `base_url` | `http://localhost:3000` | URL base da API |
| `auth_token` | *(vazio)* | Token JWT do usuário logado |
| `admin_token` | *(vazio)* | Token JWT do admin (preenchido automaticamente) |
| `user_id` | *(vazio)* | ID do usuário (preenchido automaticamente) |
| `task_id` | *(vazio)* | ID da task (preenchido automaticamente) |
| `tag_id` | *(vazio)* | ID da tag (preenchido automaticamente) |

#### Postman
- Clique na aba **"Variables"** da coleção
- Configure as seguintes variáveis:

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `base_url` | `http://localhost:3000` | URL base da API |
| `auth_token` | *(vazio)* | Token JWT do usuário logado |
| `admin_token` | *(vazio)* | Token JWT do admin (preenchido automaticamente) |
| `user_id` | *(vazio)* | ID do usuário (preenchido automaticamente) |
| `task_id` | *(vazio)* | ID da task (preenchido automaticamente) |
| `tag_id` | *(vazio)* | ID da tag (preenchido automaticamente) |

### 2. Executar o Seed (Importante!)

Antes de testar, execute o seed para ter dados de exemplo:

```bash
npm run prisma:seed
```

### 3. Fluxo de Teste Recomendado

> **⚠️ IMPORTANTE**: Sempre faça login primeiro! A maioria dos endpoints requer autenticação.

#### Passo 1: Fazer Login (OBRIGATÓRIO)
1. **Execute "Login"** usando um dos usuários do seed:
   - `admin@acessoria.com` (ADMIN) - para testar funcionalidades admin
   - `joao@acessoria.com` (USER) - para testar como usuário regular
2. **O token será automaticamente salvo** nas variáveis `auth_token`
3. **Se for admin**: `admin_token` será preenchido automaticamente
4. **Verifique se o login funcionou**: deve retornar status 200 com token

#### Passo 2: Testar Funcionalidades Básicas
1. **"Perfil do Usuário"** - Verificar dados do usuário logado
2. **"Listar Tasks"** - Ver tasks criadas pelo seed
3. **"Listar Tags"** - Ver tags criadas pelo seed

#### Passo 3: Testar CRUD de Tasks
1. **"Criar Task"** - Criar nova task (ID será salvo automaticamente)
2. **"Obter Task"** - Buscar task criada
3. **"Atualizar Task"** - Modificar task
4. **"Deletar Task"** - Remover task

#### Passo 4: Testar CRUD de Tags
1. **"Criar Tag"** - Criar nova tag (ID será salvo automaticamente)
2. **"Adicionar Tag à Task"** - Associar tag à task
3. **"Remover Tag da Task"** - Desassociar tag

#### Passo 5: Testar Funcionalidades Admin
1. **"Listar Usuários (Admin)"** - Ver todos os usuários
2. **"Listar Tasks (Admin)"** - Ver todas as tasks do sistema
3. **"Alterar Role do Usuário"** - Promover usuário a admin
4. **"Deletar Usuário (Admin)"** - Remover usuário

#### Passo 6: Verificar Estatísticas
1. **"Dashboard de Estatísticas"** - Ver métricas do usuário

## 👥 Usuários de Teste (Seed)

A coleção vem pré-configurada com os usuários criados pelo seed:

| Email | Senha | Role | Descrição |
|-------|-------|------|-----------|
| `admin@acessoria.com` | `password123` | ADMIN | Administrador do sistema |
| `joao@acessoria.com` | `password123` | USER | Usuário regular |
| `maria@acessoria.com` | `password123` | USER | Usuário regular |
| `pedro@acessoria.com` | `password123` | USER | Usuário regular |
| `ana@acessoria.com` | `password123` | USER | Usuário regular |

## 🏷️ Tags Pré-definidas (Seed)

| Nome | Cor | Descrição |
|------|-----|-----------|
| Urgente | #FF0000 | Tasks urgentes |
| Importante | #FFA500 | Tasks importantes |
| Desenvolvimento | #008000 | Tasks de desenvolvimento |
| Bug | #800080 | Correção de bugs |
| Feature | #0000FF | Novas funcionalidades |

## 🔄 Variáveis Automáticas

### Postman
A coleção possui scripts automáticos que:
- **Salvam tokens** após login
- **Salvam IDs** após criar recursos
- **Executam testes** de validação
- **Configuram admin_token** automaticamente

### Insomnia
- **Variáveis manuais** para tokens e IDs
- **Templates** para facilitar uso
- **Ambiente configurável**

## 🧪 Testes Automáticos

### Postman
- ✅ **Tempo de resposta** < 5000ms
- ✅ **JSON válido** em todas as respostas
- ✅ **Token salvo** após login
- ✅ **IDs salvos** após criação
- ✅ **Validação de roles** para admin

### Insomnia
- ✅ **Templates** para facilitar uso
- ✅ **Variáveis** configuráveis
- ✅ **Ambiente** separado

## 🚨 Troubleshooting

### Erro 401 Unauthorized
- Verifique se fez login primeiro
- Confirme se o token está sendo enviado
- Teste com usuário admin para rotas administrativas

### Erro 404 Not Found
- Verifique se a API está rodando em `http://localhost:3000`
- Confirme se executou as migrações: `npx prisma migrate dev`

### Erro 500 Internal Server Error
- Verifique se o banco está rodando: `docker-compose up -d`
- Execute o seed: `npm run prisma:seed`

### Variáveis não funcionando
- **Postman**: Verifique se está na aba "Variables" da coleção
- **Insomnia**: Verifique se está no ambiente correto

### Token não sendo salvo
- **Verifique se fez login primeiro**: Execute "Login" antes de outros requests
- **Confirme o status 200**: Login deve retornar sucesso
- **Postman**: Verifique se os scripts de teste estão executando
- **Insomnia**: Verifique se as variáveis estão sendo definidas corretamente

### Erro 401 em requests autenticados
- **Token expirado**: Faça login novamente
- **Token inválido**: Verifique se `auth_token` está preenchido
- **Header incorreto**: Deve ser `Authorization: Bearer {{auth_token}}`

### Dashboard não autorizado (específico)

#### ✅ **Diagnóstico Rápido:**
1. **Teste manual com curl** (sempre funciona):
   ```bash
   # 1. Fazer login
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@acessoria.com", "password": "password123"}'
   
   # 2. Usar o token retornado
   curl -X GET http://localhost:3000/stats/dashboard \
     -H "Authorization: Bearer SEU_TOKEN_AQUI"
   ```

#### 🔧 **Soluções para Coleções:**

**Insomnia:**
1. **Verifique o ambiente**: Vá em "Manage Environments" → "Base Environment"
2. **Confirme variáveis**: `base_url` e `auth_token` devem estar preenchidas
3. **Execute na ordem**: Login → Dashboard (não pule o login)
4. **Verifique headers**: Deve ter `Authorization: Bearer {{ _.auth_token }}`

**Postman:**
1. **Verifique variáveis**: Clique na aba "Variables" da coleção
2. **Execute na ordem**: Login → Dashboard (não pule o login)
3. **Verifique scripts**: Login deve ter script para salvar token
4. **Verifique headers**: Deve ter `Authorization: Bearer {{auth_token}}`

#### 🚨 **Se ainda não funcionar:**
1. **Reimporte a coleção**: Delete e importe novamente
2. **Limpe cache**: Reinicie o Insomnia/Postman
3. **Verifique versão**: Use versões atualizadas dos clientes
4. **Teste com curl**: Se curl funciona, o problema é na coleção

## 📊 Dados de Exemplo

Após executar o seed, você terá:
- ✅ **5 usuários** (1 admin + 4 usuários)
- ✅ **5 tags** coloridas
- ✅ **20 tasks** (5 para cada usuário)
- ✅ **Relacionamentos** entre tasks e tags

## 🎉 Pronto para Testar!

Agora você pode testar toda a API de forma organizada e eficiente. As coleções incluem:

- 🔐 **Autenticação completa**
- 📋 **CRUD de tasks**
- 🏷️ **CRUD de tags**
- 👑 **Funcionalidades admin**
- 📊 **Estatísticas**
- 🧪 **Testes automáticos**
- 📝 **Documentação integrada**

**Divirta-se testando a API!** 🚀
