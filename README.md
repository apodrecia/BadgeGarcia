# DiscordOrbVideoBypass para Enmity

Este é um plugin para o cliente Discord modificado Enmity, adaptado do plugin original DiscordOrbVideoBypass para BetterDiscord. Ele permite que você personalize e spoof (falsifique) várias informações no Discord, como texto, datas, imagens, emblemas e e-mails.

## Funcionalidades

*   **Mapeamento de Texto:** Altere textos específicos no Discord.
*   **Mapeamento de Data:** Modifique datas exibidas no cliente.
*   **Mapeamento de Imagem:** Substitua imagens por outras de sua escolha.
*   **Mapeamento de Texto de Emblemas:** Altere o texto associado aos emblemas.
*   **Mapeamento de E-mail:** Falsifique endereços de e-mail.
*   **Gerenciamento de Emblemas:** Raspe emblemas do GitHub e detecte emblemas reais para personalização.

## Instalação

1.  Baixe o arquivo `DiscordOrbVideoBypass.js` da pasta `dist` deste repositório.
2.  Abra o cliente Discord com Enmity.
3.  Vá para as configurações de plugins do Enmity.
4.  Importe o arquivo `DiscordOrbVideoBypass.js`.
5.  Ative o plugin.

## Configuração

Após a instalação e ativação, você pode acessar o painel de configurações do plugin nas configurações do Enmity. Lá, você poderá:

*   Adicionar, editar e remover mapeamentos para texto, datas, imagens, texto de emblemas e e-mails.
*   Usar a função "Scrape Badges from GitHub" para buscar novos emblemas.
*   Usar a função "Detect Real Badges" para identificar emblemas originais.
*   Limpar os emblemas originais detectados.
*   Salvar suas configurações e aplicar as falsificações.

## Desenvolvimento

Este plugin foi desenvolvido em TypeScript e compilado usando Rollup. Se você deseja contribuir ou modificar o plugin:

1.  Clone este repositório.
2.  Instale as dependências: `npm install`
3.  Compile o plugin: `npx rollup -c`
4.  O arquivo de saída estará em `dist/DiscordOrbVideoBypass.js`.

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
