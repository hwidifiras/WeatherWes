import { useState } from 'react'
import LocationList from './components/LocationList'
import MeasurementList from './components/MeasurementList'
import FavoritesList from './components/FavoritesList'
import FavoriteCounter from './components/FavoriteCounter'
import FavoritesActions from './components/FavoritesActions'
import styles from './components/App.module.css'

interface SelectedLocation {
  id: string
  name: string
}

type TabType = 'stations' | 'favorites'

function App() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('stations')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLocationSelect = (locationId: string, locationName: string) => {
    setSelectedLocation({ id: locationId, name: locationName })
    // If on mobile, collapse the sidebar when a location is selected
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(true)
    }
    // Si on est dans l'onglet favoris et qu'on sélectionne une station, on bascule sur l'onglet stations
    if (activeTab === 'favorites') {
      setActiveTab('stations')
    }
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    // Reset location selection when switching to favorites tab
    if (tab === 'favorites') {
      setSelectedLocation(null)
    }
    // On mobile, expand the sidebar when switching tabs
    if (window.innerWidth < 1024) {
      setSidebarCollapsed(false)
    }
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.headerLeft}>
            <div className={styles.iconContainer}>
              <svg className={styles.icon} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <h1 className={styles.title}>Air Quality Monitor</h1>
          </div>
          <div className={styles.headerRight}>
            {window.innerWidth < 1024 && activeTab === 'stations' && selectedLocation && (
              <button 
                className={styles.toggleButton}
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? "Afficher la liste des stations" : "Masquer la liste des stations"}
              >
                <svg className={styles.toggleButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </button>
            )}
            <div className={styles.favoriteCounterContainer}>
              <FavoriteCounter className={`${styles.textWhite} ${styles.hoverTextWhite} ${styles.transitionColors}`} />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.tabsNavigation}>
        <div className={styles.tabsContainer}>
          <div className={styles.tabsFlex}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'stations' ? styles.active : ''}`}
              onClick={() => handleTabChange('stations')}
            >
              <div className={styles.tabContent}>
                <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Stations
              </div>
              {activeTab === 'stations' && (
                <div className={styles.tabIndicator}></div>
              )}
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'favorites' ? styles.active : ''}`}
              onClick={() => handleTabChange('favorites')}
            >
              <div className={styles.tabContent}>
                <svg className={styles.tabIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
                Favoris
              </div>
              {activeTab === 'favorites' && (
                <div className={styles.tabIndicator}></div>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className={styles.main}>
        {activeTab === 'stations' ? (
          <div className={`${styles.container} ${styles.flexCol} ${styles.flexColLg} ${styles.gap8} ${styles.wFull} ${styles.maxWFull} ${styles.px4} ${styles.smPx6} ${styles.lgPx8}`}>
            <aside className={`${styles.aside} ${
              window.innerWidth < 1024 && sidebarCollapsed ? styles.hidden : ''
            }`}>
              <div className={styles.asideHeader}>
                <h2 className={styles.asideTitle}>
                  <svg className={styles.asideIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Stations de mesure
                </h2>
              </div>
              <div className={styles.asideContent}>
                <LocationList onSelectLocation={handleLocationSelect} />
              </div>
            </aside>

            <section className={`${styles.section} ${
              window.innerWidth < 1024 && !sidebarCollapsed ? styles.hidden : ''
            }`}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <svg className={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  {selectedLocation
                    ? `Mesures pour ${selectedLocation.name}`
                    : 'Mesures récentes'}
                </h2>
                {window.innerWidth < 1024 && selectedLocation && (
                  <button 
                    className={styles.mobileHeaderButton}
                    onClick={toggleSidebar}
                  >
                    <svg className={styles.mobileHeaderButtonIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className={styles.sectionContent}>
                {selectedLocation ? (
                  <MeasurementList locationId={selectedLocation.id} />
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyStateIcon}>
                      <svg className={styles.emptyStateIconSvg} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <h3 className={styles.emptyStateTitle}>Aucune station sélectionnée</h3>
                    <p className={styles.emptyStateDescription}>Sélectionnez une station dans la liste pour afficher ses mesures de qualité de l'air</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className={`${styles.container} ${styles.px4} ${styles.smPx6} ${styles.lgPx8}`}>
            <div className={styles.favoritesHeader}>
              <h2 className={styles.favoritesTitle}>
                <svg className={styles.favoritesIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
                Mes Stations Favorites
              </h2>
              <FavoritesActions onImportComplete={() => {
                // Forcer la mise à jour des composants qui utilisent les favoris
                // en ajoutant/supprimant une classe CSS (hack pour forcer le rendu)
                document.body.classList.add('favorites-updated')
                setTimeout(() => document.body.classList.remove('favorites-updated'), 100)
              }} />
            </div>
            <div className={styles.favoritesContent}>
              <FavoritesList onSelectFavorite={handleLocationSelect} />
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerText}>
            <p className={styles.footerTextContent}>
              © 2025 Air Quality Monitor. Données fournies par OpenAQ.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>
              <svg className={styles.footerLinkIcon} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerLink}>
              <svg className={styles.footerLinkIcon} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/>
              </svg>
            </a>
            <a href="#" className={styles.footerLink}>
              <svg className={styles.footerLinkIcon} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-14h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
