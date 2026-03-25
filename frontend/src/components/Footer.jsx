import './Footer.css'

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com' },
  { label: 'YouTube', href: 'https://www.youtube.com' },
  { label: 'Instagram', href: 'https://www.instagram.com' },
  { label: 'Twitter', href: 'https://x.com' },
]

const quickLinks = [
  { label: 'Contact Us', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Cookies', href: '#' },
  { label: 'Sitemap', href: '#' },
  { label: 'Visit Nestle Professional', href: '#' },
]

const Footer = () => {
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="coffee-footer">
      <div className="coffee-footer__banner" />
      <div className="coffee-footer__panel">
        <div className="coffee-footer__top">
          <div>
            <h2 className="coffee-footer__brand">NESCAFE</h2>
            <p>Follow NESCAFE on social media for even more tasty content</p>
          </div>
          <a href="#" className="coffee-footer__country">
            India
          </a>
        </div>

        <div className="coffee-footer__socials">
          {socialLinks.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>

        <div className="coffee-footer__links">
          {quickLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </div>

        <p className="coffee-footer__copyright">
          NESCAFE is a registered trademark of Societe de Produits Nestle S.A.
        </p>

        <button type="button" className="coffee-footer__top-btn" onClick={scrollTop}>
          Back To Top
        </button>
      </div>
    </footer>
  )
}

export default Footer
