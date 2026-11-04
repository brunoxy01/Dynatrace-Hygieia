# B3 Portfólio

App Dynatrace para explorar eventos de GitHub Actions por portfólio, aplicação e resultado. Os dois primeiros segmentos do nome do repositório fornecem uma classificação provisória. Conta tentativas finalizadas, inclusive reexecuções. Falhas de workflow não medem CFR.

Copie app.config.example.json para app.config.json e configure o ambiente. Crie ui/local.mapping.json com pares de repositório e ID de workflow, por exemplo [{"repo":"example/service","id":"123"}]. A lista vazia não seleciona execuções. Estes arquivos são locais. Execute npm ci --legacy-peer-deps, npm run build e npm run deploy com uma identidade autorizada no ambiente. A leitura depende das permissões Grail do usuário. A consulta cobre 30 dias, limitada às 2.000 tentativas recentes após deduplicação.

