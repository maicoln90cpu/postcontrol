/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

// ========================================
// WORKBOX PRECACHING
// ========================================

// Este ponto de injeção será substituído pelo Workbox durante o build
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.skipWaiting();
clientsClaim();

// ========================================
// SKIP WAITING PARA FORÇAR ATUALIZAÇÃO
// ========================================

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Forçando atualização imediata');
    self.skipWaiting();
  }
});

// ========================================
// PUSH NOTIFICATIONS
// ========================================

self.addEventListener('push', (event) => {
  console.log('[SW] Push notification recebida', event);

  try {
    let notificationData: any = {
      title: 'Nova Notificação',
      body: 'Você tem uma nova atualização',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: {},
    };

    if (event.data) {
      try {
        notificationData = event.data.json();
      } catch (error) {
        console.error('[SW] Erro ao parsear dados da notificação:', error);
      }
    }

    const promiseChain = self.registration.showNotification(
      notificationData.title,
      {
        body: notificationData.body,
        icon: notificationData.icon || '/pwa-192x192.png',
        badge: notificationData.badge || '/pwa-192x192.png',
        data: notificationData.data,
        tag: notificationData.data?.type || 'general',
        requireInteraction: false,
        vibrate: [200, 100, 200],
      } as any
    );

    event.waitUntil(promiseChain);
  } catch (error) {
    console.error('[SW] Erro crítico no push listener:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificação clicada', event);

  try {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/dashboard';

    const promiseChain = self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
      .catch(error => {
        console.error('[SW] Erro ao abrir janela:', error);
      });

    event.waitUntil(promiseChain);
  } catch (error) {
    console.error('[SW] Erro crítico no click listener:', error);
  }
});

self.addEventListener('notificationclose', (event) => {
  try {
    console.log('[SW] Notificação fechada', event);
  } catch (error) {
    console.error('[SW] Erro ao fechar notificação:', error);
  }
});
