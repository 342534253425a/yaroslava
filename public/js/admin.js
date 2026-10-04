document.addEventListener('click', (e) => {
  const row = e.target.closest('tr[data-href]');
  if (row && !e.target.closest('a, button, input, select')) location.href = row.dataset.href;
  const copy = e.target.closest('input.copy');
  if (copy) {
    copy.select();
    navigator.clipboard?.writeText(copy.value);
  }
});

document.addEventListener('submit', (e) => {
  const msg = e.target.dataset.confirm;
  if (msg && !confirm(msg)) e.preventDefault();
});
