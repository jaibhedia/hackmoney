/// Order Storage Module for uWu P2P Platform
/// 
/// This module provides on-chain storage for P2P orders on Sui.
/// Orders are stored as shared objects for public visibility.
#[allow(duplicate_alias, unused_const, unused_variable)]
module uwu::orders {
    use std::string::String;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use sui::event;

    // ======== Constants ========
    
    const STATUS_PENDING: u8 = 0;
    const STATUS_MATCHED: u8 = 1;
    const STATUS_PAYMENT_SENT: u8 = 2;
    const STATUS_COMPLETED: u8 = 3;
    const STATUS_CANCELLED: u8 = 4;
    const STATUS_DISPUTED: u8 = 5;

    const ORDER_TYPE_BUY: u8 = 0;
    const ORDER_TYPE_SELL: u8 = 1;

    // ======== Errors ========
    
    const ENotAuthorized: u64 = 0;
    const EInvalidStatus: u64 = 1;
    const EOrderNotFound: u64 = 2;
    const EAlreadyMatched: u64 = 3;

    // ======== Structs ========

    /// Order object - represents a single P2P order
    public struct Order has key, store {
        id: UID,
        order_id: String,           // External order ID (from frontend)
        order_type: u8,             // 0 = buy, 1 = sell
        user_address: address,      // Order creator
        solver_address: address,    // Matched solver (0x0 if unmatched)
        amount_usdc: u64,           // USDC amount (6 decimals)
        amount_fiat: u64,           // Fiat amount (2 decimals, cents)
        fiat_currency: String,      // Currency code (e.g., "INR")
        payment_method: String,     // Payment method (e.g., "UPI")
        payment_details: String,    // Payment details (e.g., UPI ID)
        status: u8,
        created_at: u64,            // Timestamp
        matched_at: u64,
        completed_at: u64,
        arc_tx_hash: String,        // Arc escrow transaction hash
    }

    /// Order Registry - stores all orders for querying
    public struct OrderRegistry has key {
        id: UID,
        orders_by_user: Table<address, vector<ID>>,
        orders_by_solver: Table<address, vector<ID>>,
        total_orders: u64,
        total_volume: u64,
    }

    /// Admin capability
    public struct AdminCap has key, store {
        id: UID,
    }

    // ======== Events ========

    public struct OrderCreated has copy, drop {
        order_id: ID,
        external_id: String,
        user: address,
        order_type: u8,
        amount_usdc: u64,
    }

    public struct OrderMatched has copy, drop {
        order_id: ID,
        solver: address,
        matched_at: u64,
    }

    public struct OrderCompleted has copy, drop {
        order_id: ID,
        completed_at: u64,
    }

    public struct OrderStatusChanged has copy, drop {
        order_id: ID,
        old_status: u8,
        new_status: u8,
    }

    // ======== Functions ========

    /// Initialize the order registry (called once on publish)
    fun init(ctx: &mut TxContext) {
        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        // Create shared order registry
        let registry = OrderRegistry {
            id: object::new(ctx),
            orders_by_user: table::new(ctx),
            orders_by_solver: table::new(ctx),
            total_orders: 0,
            total_volume: 0,
        };
        transfer::share_object(registry);
    }

    /// Create a new order
    public fun create_order(
        registry: &mut OrderRegistry,
        clock: &Clock,
        order_id: String,
        order_type: u8,
        amount_usdc: u64,
        amount_fiat: u64,
        fiat_currency: String,
        payment_method: String,
        ctx: &mut TxContext
    ): ID {
        let sender = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let order = Order {
            id: object::new(ctx),
            order_id,
            order_type,
            user_address: sender,
            solver_address: @0x0,
            amount_usdc,
            amount_fiat,
            fiat_currency,
            payment_method,
            payment_details: std::string::utf8(b""),
            status: STATUS_PENDING,
            created_at: now,
            matched_at: 0,
            completed_at: 0,
            arc_tx_hash: std::string::utf8(b""),
        };

        let order_obj_id = object::id(&order);

        // Add to user's orders
        if (!table::contains(&registry.orders_by_user, sender)) {
            table::add(&mut registry.orders_by_user, sender, vector::empty<ID>());
        };
        let user_orders = table::borrow_mut(&mut registry.orders_by_user, sender);
        vector::push_back(user_orders, order_obj_id);

        // Update registry stats
        registry.total_orders = registry.total_orders + 1;
        registry.total_volume = registry.total_volume + amount_usdc;

        // Emit event
        event::emit(OrderCreated {
            order_id: order_obj_id,
            external_id: order.order_id,
            user: sender,
            order_type,
            amount_usdc,
        });

        // Share the order object
        transfer::share_object(order);

        order_obj_id
    }

    /// Match an order (solver accepts)
    public fun match_order(
        registry: &mut OrderRegistry,
        order: &mut Order,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(order.status == STATUS_PENDING, EInvalidStatus);
        assert!(order.solver_address == @0x0, EAlreadyMatched);

        let solver = tx_context::sender(ctx);
        let now = clock::timestamp_ms(clock);

        let old_status = order.status;
        order.solver_address = solver;
        order.status = STATUS_MATCHED;
        order.matched_at = now;

        // Add to solver's orders
        if (!table::contains(&registry.orders_by_solver, solver)) {
            table::add(&mut registry.orders_by_solver, solver, vector::empty<ID>());
        };
        let solver_orders = table::borrow_mut(&mut registry.orders_by_solver, solver);
        vector::push_back(solver_orders, object::id(order));

        event::emit(OrderMatched {
            order_id: object::id(order),
            solver,
            matched_at: now,
        });

        event::emit(OrderStatusChanged {
            order_id: object::id(order),
            old_status,
            new_status: order.status,
        });
    }

    /// Update order status
    public fun update_status(
        order: &mut Order,
        new_status: u8,
        clock: &Clock,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Only user or solver can update status
        assert!(
            sender == order.user_address || sender == order.solver_address,
            ENotAuthorized
        );

        let old_status = order.status;
        order.status = new_status;

        if (new_status == STATUS_COMPLETED) {
            order.completed_at = clock::timestamp_ms(clock);
            event::emit(OrderCompleted {
                order_id: object::id(order),
                completed_at: order.completed_at,
            });
        };

        event::emit(OrderStatusChanged {
            order_id: object::id(order),
            old_status,
            new_status,
        });
    }

    /// Set Arc transaction hash
    public fun set_arc_tx_hash(
        order: &mut Order,
        tx_hash: String,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(
            sender == order.user_address || sender == order.solver_address,
            ENotAuthorized
        );
        order.arc_tx_hash = tx_hash;
    }

    /// Set payment details
    public fun set_payment_details(
        order: &mut Order,
        details: String,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(sender == order.user_address, ENotAuthorized);
        order.payment_details = details;
    }

    // ======== View Functions ========

    public fun get_order_info(order: &Order): (
        String,     // order_id
        u8,         // order_type
        address,    // user_address
        address,    // solver_address
        u64,        // amount_usdc
        u64,        // amount_fiat
        u8,         // status
        u64,        // created_at
    ) {
        (
            order.order_id,
            order.order_type,
            order.user_address,
            order.solver_address,
            order.amount_usdc,
            order.amount_fiat,
            order.status,
            order.created_at,
        )
    }

    public fun get_registry_stats(registry: &OrderRegistry): (u64, u64) {
        (registry.total_orders, registry.total_volume)
    }
}
