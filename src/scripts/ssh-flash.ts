// Re-fires the glow on the ssh box on every card click. A CSS :target rule can't:
// once the fragment is #try-ssh a repeat click won't restart the animation.
const box = document.getElementById('try-ssh');

if (box) {
  const flash = () => {
    box.classList.remove('ssh-flash');
    box.getBoundingClientRect(); // reflow, so re-adding the class restarts the animation
    box.classList.add('ssh-flash');
  };

  box.addEventListener('animationend', () => box.classList.remove('ssh-flash'));

  document.addEventListener('click', (e) => {
    const target = e.target as Element | null;
    if (target?.closest('a[href="#try-ssh"]')) flash();
  });

  if (location.hash === '#try-ssh') flash();
}
