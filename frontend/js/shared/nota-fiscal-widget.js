function renderizarBlocoNotaFiscal(container, origem, origemId, notas, bloqueado, motivoBloqueio) {
  const ativa = notas.find((n) => ['pendente', 'autorizada'].includes(n.status));

  if (ativa) {
    container.innerHTML = `
      <p style="font-size:13px;"><strong>Nota fiscal:</strong> ${ativa.tipo === 'nfce' ? 'NFC-e' : 'NFe 55'} — status ${ativa.status}</p>
      ${ativa.chave_acesso ? `<p style="font-size:11px; font-family:monospace; color:#6b7280;">${ativa.chave_acesso}</p>` : ''}
      <a href="notas-fiscais.html" class="btn-link">Ver em Notas Fiscais</a>
    `;
    return;
  }

  container.innerHTML = `
    <button type="button" class="botao primario" id="btn-emitir-nf" ${bloqueado ? `disabled title="${motivoBloqueio || ''}"` : ''} style="width:100%; justify-content:center;">Emitir Nota Fiscal</button>
    <div class="mensagem" id="mensagem-nf" style="margin-top:6px;"></div>
    ${notas.length > 0 ? `<p style="font-size:11px; color:#b91c1c; margin-top:6px;">Última tentativa: ${notas[0].status} — ${notas[0].motivo || ''}</p>` : ''}
  `;

  const botao = document.getElementById('btn-emitir-nf');
  if (botao && !bloqueado) {
    botao.addEventListener('click', async () => {
      const mensagemEl = document.getElementById('mensagem-nf');
      botao.disabled = true;
      try {
        await api.post('/notas-fiscais/emitir', { origem, origem_id: origemId });
        mensagemEl.textContent = 'Nota emitida com sucesso.';
        mensagemEl.className = 'mensagem sucesso';
      } catch (erro) {
        mensagemEl.textContent = erro.message;
        mensagemEl.className = 'mensagem erro';
      } finally {
        botao.disabled = false;
        const notasAtualizadas = await api.get(`/notas-fiscais/origem/${origem}/${origemId}`).catch(() => []);
        renderizarBlocoNotaFiscal(container, origem, origemId, notasAtualizadas, bloqueado, motivoBloqueio);
      }
    });
  }
}
