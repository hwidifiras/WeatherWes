import { useState } from 'react'
import LocationList from './components/LocationList'
import MeasurementList from './components/MeasurementList'
import FavoritesList from './components/FavoritesList'
import FavoriteCounter from './components/FavoriteCounter'
import FavoritesActions from './components/FavoritesActions'
import ThemeTest from './components/ThemeTest'

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
    <div className="flex flex-col min-h-screen bg-background">
      {/* Theme Test Component */}
      <div className="bg-white p-4 mb-4 border-b border-gray-200">
        <div className="container mx-auto">
          <ThemeTest />
        </div>
      </div>
      
      <header className="relative z-10 bg-gradient-to-r from-primary-800 to-primary-600 text-white pb-4">
        <div className="container mx-auto px-4 py-6 sm:px-6 flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-white/10 p-3 rounded-xl mr-4 shadow-md backdrop-blur-sm">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Air Quality Monitor</h1>
          </div>
          <div className="flex items-center">
            {window.innerWidth < 1024 && activeTab === 'stations' && selectedLocation && (
              <button 
                className="mr-4 text-white hover:bg-white/20 p-3 rounded-full transition-colors duration-200"
                onClick={toggleSidebar}
                aria-label={sidebarCollapsed ? "Afficher la liste des stations" : "Masquer la liste des stations"}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  {sidebarCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </button>
            )}
            <div className="bg-white/20 p-3 rounded-full shadow-sm backdrop-blur-sm hover:bg-white/30 transition-colors duration-200">
              <FavoriteCounter className="text-white hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </header>

      <div className="tabs-navigation bg-white shadow-sm sticky top-0 z-20 w-full border-b border-gray-200">
        <div className="container mx-auto">
          <div className="flex">
            <button 
              className={`py-5 px-8 font-medium text-center relative transition-colors duration-200 ${
                activeTab === 'stations' 
                  ? 'text-primary-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleTabChange('stations')}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Stations
              </div>
              {activeTab === 'stations' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-600 rounded-t-sm"></div>
              )}
            </button>
            <button 
              className={`py-5 px-8 font-medium text-center relative flex items-center transition-colors duration-200 ${
                activeTab === 'favorites' 
                  ? 'text-primary-600 font-semibold' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => handleTabChange('favorites')}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                </svg>
                Favoris
              </div>
              {activeTab === 'favorites' && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-600 rounded-t-sm"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="flex-grow w-full py-8">
        {activeTab === 'stations' ? (
          <div className="container mx-auto flex flex-col lg:flex-row gap-8 w-full max-w-full px-4 sm:px-6 lg:px-8">
            <aside className={`lg:w-1/3 xl:w-1/4 flex-shrink-0 transition-all duration-300 ${
              window.innerWidth < 1024 && sidebarCollapsed ? 'hidden' : 'block'
            }`}>
              <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white rounded-t-xl py-4 px-6">
                <h2 className="text-lg font-medium flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  Stations de mesure
                </h2>
              </div>
              <div className="bg-white overflow-hidden rounded-b-xl shadow-lg border border-gray-200 border-t-0">
                <LocationList onSelectLocation={handleLocationSelect} />
              </div>
            </aside>

            <section className={`w-full transition-all duration-300 ${
              window.innerWidth < 1024 && !sidebarCollapsed ? 'hidden' : 'block lg:flex-1'
            }`}>
              <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white rounded-t-xl py-4 px-6 flex justify-between items-center">
                <h2 className="text-lg font-medium flex items-center">
                  <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  {selectedLocation
                    ? `Mesures pour ${selectedLocation.name}`
                    : 'Mesures récentes'}
                </h2>
                {window.innerWidth < 1024 && selectedLocation && (
                  <button 
                    className="text-white hover:bg-white/20 p-2 rounded-full transition-all duration-200"
                    onClick={toggleSidebar}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </button>
                )}
              </div>
              
              <div className="bg-white rounded-b-xl shadow-lg border border-gray-200 border-t-0 overflow-hidden">
                {selectedLocation ? (
                  <MeasurementList locationId={selectedLocation.id} />
                ) : (
                  <div className="flex flex-col items-center justify-center p-16">
                    <div className="bg-primary-100 p-6 rounded-full mb-6">
                      <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <h3 className="text-2xl font-medium text-gray-900 mb-3">Aucune station sélectionnée</h3>
                    <p className="text-gray-600 max-w-md text-center">Sélectionnez une station dans la liste pour afficher ses mesures de qualité de l'air</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white rounded-t-xl py-4 px-6 flex justify-between items-center">
              <h2 className="text-lg font-medium flex items-center">
                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            <div className="bg-white rounded-b-xl shadow-lg border border-gray-200 border-t-0">
              <FavoritesList onSelectFavorite={handleLocationSelect} />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto shadow-sm w-full">
        <div className="container mx-auto px-4 py-6 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
          <div className="mb-3 sm:mb-0">
            <p className="text-sm text-gray-600">
              © 2025 Air Quality Monitor. Données fournies par OpenAQ.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-500 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-11v6h2v-6h-2zm0-4v2h2V7h-2z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm0-4h-2V7h2v8z"/>
              </svg>
            </a>
            <a href="#" className="text-gray-500 hover:text-primary transition-colors p-2 hover:bg-gray-100 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
