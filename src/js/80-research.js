document.querySelectorAll('.faq-question').forEach(item => {
  item.addEventListener('click', () => {
      const parent = item.parentElement;
      parent.classList.toggle('active');
      const arrow = item.querySelector('.arrow');
      arrow.style.transform = parent.classList.contains('active') ? 'rotate(90deg)' : 'rotate(0deg)';
  });
});
