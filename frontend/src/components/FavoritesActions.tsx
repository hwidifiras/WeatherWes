import { useState } from 'react'
import { exportFavorites, importFavorites } from '../utils/favoritesService'
import styles from './FavoritesActions.module.css'

interface FavoritesActionsProps {
  onImportComplete: () => void
}

/**
 * Composant pour les actions d'export/import des favoris
 */
function FavoritesActions({ onImportComplete }: FavoritesActionsProps) {
  const [showImportModal, setShowImportModal] = useState(false)
  const [importData, setImportData] = useState('')
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

  // Gérer l'export des favoris
  const handleExport = () => {
    const jsonData = exportFavorites()
    
    // Créer un élément <a> temporaire pour déclencher le téléchargement
    const element = document.createElement('a')
    const file = new Blob([jsonData], { type: 'application/json' })
    element.href = URL.createObjectURL(file)
    element.download = `weatherwes_favorites_${new Date().toISOString().split('T')[0]}.json`
    
    // Simuler un clic pour déclencher le téléchargement
    document.body.appendChild(element)
    element.click()
    
    // Nettoyer
    document.body.removeChild(element)
  }

  // Gérer l'import des favoris
  const handleImport = () => {
    try {
      if (!importData.trim()) {
        setImportError('Veuillez coller des données JSON valides')
        return
      }

      const importedCount = importFavorites(importData)
      
      if (importedCount < 0) {
        setImportError('Format JSON invalide. Veuillez vérifier les données collées.')
        return
      }
      
      // Réinitialiser l'état
      setImportData('')
      setImportError('')
      
      // Afficher le message de succès
      setImportSuccess(`${importedCount} station(s) favorite(s) importée(s) avec succès !`)
      setTimeout(() => {
        setImportSuccess('')
        setShowImportModal(false)
        // Déclencher le callback pour rafraîchir la liste
        onImportComplete()
      }, 2000)
      
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error)
      setImportError('Une erreur est survenue lors de l\'importation')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.buttonGroup}>
        <button
          onClick={handleExport}
          className={styles.exportButton}
          title="Exporter vos favoris en fichier JSON"
        >
          Exporter les favoris
        </button>
        <button
          onClick={() => setShowImportModal(true)}
          className={styles.importButton}
          title="Importer des favoris depuis un fichier JSON"
        >
          Importer des favoris
        </button>
      </div>

      {/* Modal d'import */}
      {showImportModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Importer des favoris</h3>
            
            <div className={styles.modalBody}>
              <label className={styles.label}>
                Collez le contenu JSON de vos favoris :
              </label>
              <textarea
                className={styles.textarea}
                value={importData}
                onChange={(e) => {
                  setImportData(e.target.value)
                  setImportError('')
                }}
                placeholder='[{"id":"123","name":"Station 1",...}]'
              ></textarea>
              
              {importError && (
                <p className={styles.errorMessage}>{importError}</p>
              )}
              
              {importSuccess && (
                <p className={styles.successMessage}>{importSuccess}</p>
              )}
            </div>
            
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowImportModal(false)}
                className={styles.cancelButton}
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                className={styles.confirmButton}
                disabled={!!importSuccess}
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FavoritesActions
