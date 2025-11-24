const syncPointer = ({ x: pointerX, y: pointerY }) => {
  const x = pointerX.toFixed(2)
  const y = pointerY.toFixed(2)
  const xp = (pointerX / window.innerWidth).toFixed(2)
  const yp = (pointerY / window.innerHeight).toFixed(2)
  document.documentElement.style.setProperty('--x', x)
  document.documentElement.style.setProperty('--xp', xp)
  document.documentElement.style.setProperty('--y', y)
  document.documentElement.style.setProperty('--yp', yp)
}
document.body.addEventListener('pointermove', syncPointer)


// Age calculation
const dob = new Date('2010-11-17');

function getAge(dob) {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();

  // check if the dob has occured
  const monthDiff = now.getMonth() - dob.getMonth();
  const dayDiff = now.getDate() - dob.getDate();
  
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age;
}

document.getElementById('age').textContent = getAge(dob) + 'yo';
