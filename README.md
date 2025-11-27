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

## Observações
- O frontend atual usa localStorage para persistência (`script.js`). Você pode migrá-lo para consumir as rotas do backend (usar fetch/AJAX) para integração com o banco.
- Imagens são armazenadas como metadados no banco; para uploads reais, considere usar `multer` e salvar arquivos localmente ou em um storage (S3, Cloudinary).
