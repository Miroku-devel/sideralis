(() => {
  "use strict";
  
  function isMobile () {
    if (navigator.userAgentData) return navigator.userAgentData.mobile
    return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
  const rotOverlay = document.getElementById('rotate-overlay')
  function checkOrientation () {
    if (isMobile() && window.innerWidth > window.innerHeight) {
      rotOverlay.classList.remove('hidden')
      document.body.classList.add('orientation-locked')
    } else {
      rotOverlay.classList.add('hidden')
      document.body.classList.remove('orientation-locked')
    }
  }
  window.addEventListener('resize', checkOrientation)
  window.addEventListener('orientationchange', checkOrientation)
  checkOrientation()
})()
