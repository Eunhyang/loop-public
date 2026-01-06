"""
Firebase Firestore service for ContentOS
Manages connection and provides helpers for subcollections under loop/main
"""

import os
import logging
from typing import Optional
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1 import Client, DocumentReference, CollectionReference

logger = logging.getLogger(__name__)


class FirebaseService:
    """Singleton Firebase Admin SDK service"""

    _instance: Optional['FirebaseService'] = None
    _db: Optional[Client] = None
    _initialized: bool = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self._initialize()

    def _initialize(self):
        """Initialize Firebase Admin SDK from environment credentials"""
        try:
            cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
            if not cred_path:
                raise ValueError(
                    "GOOGLE_APPLICATION_CREDENTIALS environment variable not set. "
                    "Please set it to the path of your Firebase service account JSON file."
                )

            if not os.path.exists(cred_path):
                raise FileNotFoundError(
                    f"Service account key file not found at: {cred_path}"
                )

            # Initialize Firebase Admin (if not already initialized)
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
                logger.info(f"Firebase Admin SDK initialized with service account from {cred_path}")
            else:
                logger.info("Firebase Admin SDK already initialized")

            self._db = firestore.client()
            self._initialized = True

        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {str(e)}")
            raise

    @property
    def db(self) -> Client:
        """Get Firestore client"""
        if not self._db:
            raise RuntimeError("Firebase service not initialized")
        return self._db

    def get_root_doc(self) -> DocumentReference:
        """Get the root document: loop/main"""
        return self.db.collection('loop').document('main')

    def get_subcollection(self, name: str) -> CollectionReference:
        """
        Get a subcollection reference under loop/main

        Args:
            name: Subcollection name (e.g., 'contentos_contents')

        Returns:
            CollectionReference for the subcollection
        """
        return self.get_root_doc().collection(name)

    # Convenience methods for each subcollection

    def contentos_contents(self) -> CollectionReference:
        """Get contentos_contents subcollection"""
        return self.get_subcollection('contentos_contents')

    def contentos_publishes(self) -> CollectionReference:
        """Get contentos_publishes subcollection"""
        return self.get_subcollection('contentos_publishes')

    def contentos_assets(self) -> CollectionReference:
        """Get contentos_assets subcollection"""
        return self.get_subcollection('contentos_assets')

    def vault_projects(self) -> CollectionReference:
        """Get vault_projects subcollection"""
        return self.get_subcollection('vault_projects')

    def vault_tasks(self) -> CollectionReference:
        """Get vault_tasks subcollection"""
        return self.get_subcollection('vault_tasks')

    def vault_pending_reviews(self) -> CollectionReference:
        """Get vault_pending_reviews subcollection"""
        return self.get_subcollection('vault_pending_reviews')

    def kpi_defs(self) -> CollectionReference:
        """Get kpi_defs subcollection"""
        return self.get_subcollection('kpi_defs')

    def kpi_rollups(self) -> CollectionReference:
        """Get kpi_rollups subcollection"""
        return self.get_subcollection('kpi_rollups')

    def kpi_rollup_days(self, scope_id: str) -> CollectionReference:
        """
        Get nested days subcollection under kpi_rollups/{scopeId}

        Args:
            scope_id: The scope ID for the rollup

        Returns:
            CollectionReference for days subcollection
        """
        return self.get_subcollection('kpi_rollups').document(scope_id).collection('days')


# Singleton instance
firebase_service = FirebaseService()
