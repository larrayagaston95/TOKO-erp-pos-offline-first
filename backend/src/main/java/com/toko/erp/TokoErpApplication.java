package com.toko.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ============================================================================
 * PUNTO DE ENTRADA - TOKO ERP BACKEND
 * ============================================================================
 * Sistema SaaS Offline-First para distribuidoras y puntos de venta.
 * El frontend (React + Dexie.js) genera UUIDs localmente y sincroniza
 * las transacciones contra este backend mediante el endpoint /api/v1/sync/push.
 */
@SpringBootApplication
public class TokoErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(TokoErpApplication.class, args);
    }
}
