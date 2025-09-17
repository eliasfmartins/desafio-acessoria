#!/bin/bash

# Token de autenticação
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2Yzc3MTdhNS00MjE0LTRjYTQtYTVjMy1hNGI4NzE4NjE5NDgiLCJlbWFpbCI6ImFkbWluQGFjZXNzb3JpYS5jb20iLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NTgwNzM1ODUsImV4cCI6MTc1ODY3ODM4NX0.r0y8rENmrEby2oEfJ63hVSsaxb7CA9HawORRXLXncfQ"

BASE_URL="http://localhost:3000"

echo "🧪 TESTANDO TODAS AS ROTAS DA API"
echo "=================================="

# 1. TESTE ENDPOINT RAIZ
echo -e "\n1️⃣ TESTANDO ENDPOINT RAIZ"
echo "GET /"
curl -s -X GET "$BASE_URL/" | head -c 100
echo -e "\n"

# 2. TESTE AUTENTICAÇÃO
echo -e "\n2️⃣ TESTANDO AUTENTICAÇÃO"
echo "GET /auth/profile"
curl -s -X GET "$BASE_URL/auth/profile" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 3. TESTE TASKS - LISTAR
echo -e "\n3️⃣ TESTANDO TASKS - LISTAR"
echo "GET /tasks (primeira vez - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tasks (segunda vez - deve dar Cache HIT)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 4. TESTE TASKS - CRIAR
echo -e "\n4️⃣ TESTANDO TASKS - CRIAR"
echo "POST /tasks"
curl -s -X POST "$BASE_URL/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Task Teste Cache", "description": "Testando cache após criação", "status": "PENDING", "priority": "HIGH"}' | head -c 200
echo -e "\n"

echo "GET /tasks (após criar - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 5. TESTE TASKS - BUSCAR POR ID
echo -e "\n5️⃣ TESTANDO TASKS - BUSCAR POR ID"
echo "GET /tasks/:id (primeira vez - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tasks/:id (segunda vez - deve dar Cache HIT)"
curl -s -X GET "$BASE_URL/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 6. TESTE TASKS - ATUALIZAR
echo -e "\n6️⃣ TESTANDO TASKS - ATUALIZAR"
echo "PATCH /tasks/:id"
curl -s -X PATCH "$BASE_URL/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_PROGRESS"}' | head -c 200
echo -e "\n"

echo "GET /tasks (após atualizar - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 7. TESTE TAGS - LISTAR
echo -e "\n7️⃣ TESTANDO TAGS - LISTAR"
echo "GET /tags (primeira vez - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tags" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tags (segunda vez - deve dar Cache HIT)"
curl -s -X GET "$BASE_URL/tags" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 8. TESTE TAGS - CRIAR
echo -e "\n8️⃣ TESTANDO TAGS - CRIAR"
echo "POST /tags"
curl -s -X POST "$BASE_URL/tags" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Tag Teste Cache", "color": "#FF5733"}' | head -c 200
echo -e "\n"

echo "GET /tags (após criar - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tags" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 9. TESTE TAGS - BUSCAR POR ID
echo -e "\n9️⃣ TESTANDO TAGS - BUSCAR POR ID"
echo "GET /tags/:id (primeira vez - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tags/6c7717a5-4214-4ca4-a5c3-a4b871861948" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tags/:id (segunda vez - deve dar Cache HIT)"
curl -s -X GET "$BASE_URL/tags/6c7717a5-4214-4ca4-a5c3-a4b871861948" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 10. TESTE TAGS - ATUALIZAR
echo -e "\n🔟 TESTANDO TAGS - ATUALIZAR"
echo "PATCH /tags/:id"
curl -s -X PATCH "$BASE_URL/tags/6c7717a5-4214-4ca4-a5c3-a4b871861948" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"color": "#00FF00"}' | head -c 200
echo -e "\n"

echo "GET /tags (após atualizar - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tags" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 11. TESTE ASSOCIAR TAG À TASK
echo -e "\n1️⃣1️⃣ TESTANDO ASSOCIAR TAG À TASK"
echo "POST /tags/tasks/:taskId"
curl -s -X POST "$BASE_URL/tags/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tagId": "6c7717a5-4214-4ca4-a5c3-a4b871861948"}' | head -c 200
echo -e "\n"

echo "GET /tasks (após associar tag - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 12. TESTE REMOVER TAG DA TASK
echo -e "\n1️⃣2️⃣ TESTANDO REMOVER TAG DA TASK"
echo "DELETE /tags/tasks/:taskId/:tagId"
curl -s -X DELETE "$BASE_URL/tags/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948/6c7717a5-4214-4ca4-a5c3-a4b871861948" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tasks (após remover tag - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 13. TESTE SOFT DELETE TASK
echo -e "\n1️⃣3️⃣ TESTANDO SOFT DELETE TASK"
echo "DELETE /tasks/:id"
curl -s -X DELETE "$BASE_URL/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tasks (após soft delete - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 14. TESTE RESTAURAR TASK
echo -e "\n1️⃣4️⃣ TESTANDO RESTAURAR TASK"
echo "POST /tasks/:id/restore"
curl -s -X POST "$BASE_URL/tasks/6c7717a5-4214-4ca4-a5c3-a4b871861948/restore" \
  -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

echo "GET /tasks (após restaurar - deve dar Cache MISS)"
curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 15. TESTE ADMIN - LISTAR USUÁRIOS
echo -e "\n1️⃣5️⃣ TESTANDO ADMIN - LISTAR USUÁRIOS"
echo "GET /admin/users"
curl -s -X GET "$BASE_URL/admin/users" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 16. TESTE ADMIN - LISTAR TASKS
echo -e "\n1️⃣6️⃣ TESTANDO ADMIN - LISTAR TASKS"
echo "GET /admin/tasks"
curl -s -X GET "$BASE_URL/admin/tasks" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 17. TESTE ADMIN - USUÁRIOS DELETADOS
echo -e "\n1️⃣7️⃣ TESTANDO ADMIN - USUÁRIOS DELETADOS"
echo "GET /admin/users/deleted"
curl -s -X GET "$BASE_URL/admin/users/deleted" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 18. TESTE ADMIN - TASKS DELETADAS
echo -e "\n1️⃣8️⃣ TESTANDO ADMIN - TASKS DELETADAS"
echo "GET /admin/tasks/deleted"
curl -s -X GET "$BASE_URL/admin/tasks/deleted" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 19. TESTE STATS - DASHBOARD
echo -e "\n1️⃣9️⃣ TESTANDO STATS - DASHBOARD"
echo "GET /stats/dashboard"
curl -s -X GET "$BASE_URL/stats/dashboard" -H "Authorization: Bearer $TOKEN" | head -c 200
echo -e "\n"

# 20. TESTE RATE LIMITING
echo -e "\n2️⃣0️⃣ TESTANDO RATE LIMITING"
echo "Fazendo 5 requests rápidos para testar rate limiting..."
for i in {1..5}; do
  echo "Request $i:"
  curl -s -X GET "$BASE_URL/tasks" -H "Authorization: Bearer $TOKEN" -w "Status: %{http_code}\n" | head -c 50
  echo
done

echo -e "\n✅ TESTE COMPLETO FINALIZADO!"
echo "Verifique os logs da aplicação para confirmar se o cache está funcionando corretamente."
