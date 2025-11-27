# PDV Online (Backend)

Este repositório contém um simples backend para o sistema PDV (ponto de venda) com integração a MongoDB via mongoose.

## Requisitos
- Node.js 18+
- MongoDB (local ou Atlas)

## Instalação
1. Copie `.env.example` para `.env` e ajuste `MONGODB_URI` se necessário.
```
cp .env.example .env
```

2. Instale dependências
```
npm install
```

3. Rodar servidor em desenvolvimento
```
npm run dev
```
ou em produção:
```
npm start
```

4. Popular banco com dados de exemplo (seed)
```
npm run seed
```

## Endpoints principais (exemplos)
- GET /api/products — lista produtos
- GET /api/products/barcode/:barcode — buscar produto por código
- POST /api/products — criar produto
- PUT /api/products/:id — atualizar produto
- DELETE /api/products/:id — remover (marca inativo)
- POST /api/sales — criar venda
- GET /api/sales — listar vendas
- POST /api/seed-products — popular produtos de exemplo (controle manual)
- GET /api/clients — listar clientes
- POST /api/clients — criar cliente
- GET /api/images — listar imagens (metadados)
- POST /api/images — salvar imagem (metadados)

## Como conectar com MongoDB Atlas (opcional)
1. Crie um cluster no MongoDB Atlas e copie a connection string.
2. Atualize `.env` com a URI (substituindo usuário e senha):
```
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/pdv-system?retryWrites=true&w=majority
```

## Teste rápido com cURL
- Inserir um produto:
```
curl -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d '{"barcode":"123456","name":"Produto Teste","price":9.99,"stock":10}'
```

- Listar produtos:
```
curl http://localhost:3000/api/products
```

- Criar cliente:
```
curl -X POST http://localhost:3000/api/clients -H "Content-Type: application/json" -d '{"name":"Cliente Teste","email":"cliente@test.com"}'
```

- Realizar uma venda (exemplo):
```
curl -X POST http://localhost:3000/api/sales -H "Content-Type: application/json" -d '{"items":[{"product":"<productObjectId>","productName":"Produto Teste","quantity":1,"unitPrice":9.99}],"total":9.99,"paymentMethod":"cash"}'
```

## Iniciando uma instância local do MongoDB (Docker)
Se você não tem MongoDB local instalado, pode usar Docker:
```
docker run -d --name pdv-mongo -p 27017:27017 mongo:7
```

Após isso, verifique se o serviço está rodando e rode `npm run seed` para popular o banco com dados de exemplo.



## Observações
- O frontend atual usa localStorage para persistência (`script.js`). Você pode migrá-lo para consumir as rotas do backend (usar fetch/AJAX) para integração com o banco.
- Imagens são armazenadas como metadados no banco; para uploads reais, considere usar `multer` e salvar arquivos localmente ou em um storage (S3, Cloudinary).
