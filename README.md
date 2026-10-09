# BANCADA.az

Loja simples em português para vendas em Angola. Interface em azul escuro e laranja, inspirada nas referências fornecidas, com ilustrações locais de demonstração. Node.js 24+, Vite e SQLite, sem serviços externos obrigatórios.

## Executar

```sh
cd /workspace/BANCADA.az
npm ci --cache /workspace/.npm --no-audit --no-fund
npm run build
npm start
```

O servidor usa a porta 3000 por padrão. `PORT` altera a porta. O banco é criado automaticamente em `.data/bancada.sqlite`; `BANCADA_DATA_DIR` permite usar um diretório persistente diferente. A aplicação precisa do servidor Node, não apenas de hospedagem estática.

Para desenvolvimento com atualização automática, mantenha `npm start` numa sessão e execute `npm run dev` noutra. O Vite encaminha `/api` para o servidor na porta 3000. Use o checkout existente; cada tarefa na nuvem já tem um ambiente isolado, sem necessidade de criar worktrees.

## Cadastrar os seus produtos

1. Execute `npm run admin:create` no terminal. Informe o seu telefone e uma senha de pelo menos 12 caracteres nos prompts; a senha não é exibida. O comando também pode redefinir a senha de um administrador e invalida as sessões anteriores dessa conta.
2. Abra **Conta**, entre com esse telefone e senha e escolha **Gerir produtos**.
3. Cadastre nome, identificador único, preço em AOA, categoria, descrição, características e endereço HTTPS da foto. Pode editar e remover produtos. O identificador mantém o link estável.
4. Remova os seis exemplos antes de anunciar produtos reais. Os exemplos são explicitamente marcados como demonstração e têm ilustrações, não fotografias de mercadoria real.
5. Use **Copiar link** para partilhar a página do produto em anúncios. Depois de publicar num domínio público, copie os links desse domínio. Links copiados numa máquina local só funcionam nessa máquina.

Nenhuma conta de administrador ou senha padrão é criada automaticamente. As contas de clientes são criadas pelo botão **Cadastre-se**; apenas um administrador criado pelo terminal pode gerir o catálogo. Senhas são guardadas com scrypt e salt; sessões usam tokens aleatórios, armazenados no banco apenas como hash, com cookie HttpOnly e validade de sete dias. Há um limite básico para tentativas de login/cadastro por endereço de ligação.

## Fluxo da venda

- Catálogo com pesquisa e filtros, páginas de produto, carrinho persistente e preços em kwanza (AOA).
- **Conversar sobre este produto** abre diretamente o WhatsApp **+244 929 560 940**, com nome, preço, link da página e link da imagem.
- **Comprar este produto** leva ao checkout, ou o cliente pode preparar vários produtos no carrinho.
- Nome, telefone de Angola, província, município/localidade endereço e ponto de referência são obrigatórios. Observações são opcionais. Pode comprar sem conta.
- As entregas iniciais abrangem **Luanda** (16 localidades) e **Icolo e Bengo** (7 localidades), de acordo com as últimas listas fornecidas pelo responsável da loja, em `src/locations.js`. Não se afirma cobrir todos os municípios de Angola.
- O formulário valida os dados e prepara uma mensagem. **Abrir WhatsApp e enviar pedido** abre o WhatsApp; o cliente ainda precisa confirmar o envio lá. A mensagem inclui produtos, quantidades, subtotal, dados de entrega e links das imagens. O link de uma imagem não equivale ao envio automático de um anexo/foto; a loja pode enviar a foto durante a conversa.
- Após abrir o WhatsApp, o site mostra o agradecimento e a orientação para aguardar contacto ou chamada, sem prometer horário. Um botão permite voltar à loja. O carrinho é preservado porque o site não consegue confirmar o envio no WhatsApp.
- Disponibilidade, entrega, total final e pagamento são combinados na conversa. Não há cobrança online, confirmação automática de pagamento, integração WhatsApp Business API ou promessa de entrega.
- Clientes autenticados podem guardar os dados de entrega na conta. Visitantes podem optar por guardar dados no dispositivo. Não guarde dados pessoais em dispositivos partilhados.

## Verificar

```sh
npm test
npm run build
npm run test:e2e
```

Os testes de navegador usam Chromium em `/usr/bin/chromium`; pode definir `BANCADA_CHROMIUM_PATH` para outro executável instalado. Usam um banco temporário separado, contas de teste e um servidor na porta 3100. Não enviam mensagens reais pelo WhatsApp. Testam catálogo, pesquisa, links, carrinho, formulário, cadastro/login, persistência, permissões e gestão de produtos; verificam também layout móvel.

## Publicar a loja

Use um servidor com Node 24, HTTPS e armazenamento persistente para o diretório do banco; execute `npm ci`, `npm run build` e `NODE_ENV=production npm start`. Em produção o cookie de sessão exige HTTPS. Faça cópias de segurança do banco com as ferramentas de backup do SQLite, preservando a consistência de WAL. Nunca versione `.data`, senhas, cookies ou dados de clientes.

Esta é a primeira versão: recuperação automática de senha, histórico de pedidos e pagamentos online não estão implementados. Para redefinir a senha de um cliente, será necessário um fluxo administrativo adicional; não exponha o comando de administração no site. Antes de abrir ao público, configure hospedagem, domínio, fotos/produtos reais, política de privacidade e o administrador.
