/// uWu Names - ENS-style naming system on Sui
/// 
/// Provides .uwu usernames that map to wallet addresses.
/// Names are stored as owned objects for gas efficiency.
#[allow(duplicate_alias, unused_use, deprecated_usage)]
module uwu::names {
    use std::string::String;
    use sui::table::{Self, Table};
    use sui::event;

    // ======== Constants ========
    
    const MIN_NAME_LENGTH: u64 = 3;
    const MAX_NAME_LENGTH: u64 = 20;

    // ======== Errors ========
    
    const ENameTooShort: u64 = 0;
    const ENameTooLong: u64 = 1;
    const ENameTaken: u64 = 2;
    const EInvalidCharacter: u64 = 3;
    const ENotOwner: u64 = 4;
    const ENameNotFound: u64 = 5;

    // ======== Structs ========

    /// Name NFT - represents ownership of a .uwu name
    public struct UwuName has key, store {
        id: UID,
        name: String,               // The username (without .uwu suffix)
        owner: address,             // Current owner
        registered_at: u64,         // Registration timestamp
        expires_at: u64,            // Expiration timestamp (0 = never)
    }

    /// Name Registry - stores name -> address mappings
    public struct NameRegistry has key {
        id: UID,
        names: Table<String, address>,              // name -> owner
        addresses: Table<address, String>,          // owner -> primary name
        total_names: u64,
    }

    /// Admin capability
    public struct AdminCap has key, store {
        id: UID,
    }

    // ======== Events ========

    public struct NameRegistered has copy, drop {
        name: String,
        owner: address,
        registered_at: u64,
    }

    public struct NameTransferred has copy, drop {
        name: String,
        from: address,
        to: address,
    }

    public struct PrimaryNameSet has copy, drop {
        owner: address,
        name: String,
    }

    // ======== Functions ========

    /// Initialize the name registry
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::transfer(admin_cap, tx_context::sender(ctx));

        let registry = NameRegistry {
            id: object::new(ctx),
            names: table::new(ctx),
            addresses: table::new(ctx),
            total_names: 0,
        };
        transfer::share_object(registry);
    }

    /// Register a new .uwu name
    public fun register_name(
        registry: &mut NameRegistry,
        name: String,
        ctx: &mut TxContext
    ): UwuName {
        let name_bytes = name.as_bytes();
        let name_len = name_bytes.length();

        // Validate name length
        assert!(name_len >= MIN_NAME_LENGTH, ENameTooShort);
        assert!(name_len <= MAX_NAME_LENGTH, ENameTooLong);

        // Validate characters (a-z, 0-9, _)
        let mut i = 0;
        while (i < name_len) {
            let char = *name_bytes.borrow(i);
            let is_lowercase = char >= 97 && char <= 122; // a-z
            let is_digit = char >= 48 && char <= 57;      // 0-9
            let is_underscore = char == 95;               // _
            assert!(is_lowercase || is_digit || is_underscore, EInvalidCharacter);
            i = i + 1;
        };

        // Check if name is available
        assert!(!table::contains(&registry.names, name), ENameTaken);

        let sender = tx_context::sender(ctx);
        let now = tx_context::epoch(ctx);

        // Create name NFT
        let uwu_name = UwuName {
            id: object::new(ctx),
            name,
            owner: sender,
            registered_at: now,
            expires_at: 0, // Never expires for now
        };

        // Register in lookup tables
        table::add(&mut registry.names, name, sender);
        
        // Set as primary name if user doesn't have one
        if (!table::contains(&registry.addresses, sender)) {
            table::add(&mut registry.addresses, sender, name);
        };

        registry.total_names = registry.total_names + 1;

        event::emit(NameRegistered {
            name,
            owner: sender,
            registered_at: now,
        });

        uwu_name
    }

    /// Transfer a name to another address
    public fun transfer_name(
        registry: &mut NameRegistry,
        uwu_name: UwuName,
        to: address,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(uwu_name.owner == sender, ENotOwner);

        let name = uwu_name.name;

        // Update registry
        let owner_ref = table::borrow_mut(&mut registry.names, name);
        *owner_ref = to;

        // Remove as primary name if it was
        if (table::contains(&registry.addresses, sender)) {
            let primary = table::borrow(&registry.addresses, sender);
            if (*primary == name) {
                table::remove(&mut registry.addresses, sender);
            };
        };

        event::emit(NameTransferred {
            name,
            from: sender,
            to,
        });

        // Transfer the NFT
        transfer::transfer(uwu_name, to);
    }

    /// Set primary name for an address
    public fun set_primary_name(
        registry: &mut NameRegistry,
        uwu_name: &UwuName,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(uwu_name.owner == sender, ENotOwner);

        // Remove old primary name if exists
        if (table::contains(&registry.addresses, sender)) {
            table::remove(&mut registry.addresses, sender);
        };

        // Set new primary name
        table::add(&mut registry.addresses, sender, uwu_name.name);

        event::emit(PrimaryNameSet {
            owner: sender,
            name: uwu_name.name,
        });
    }

    // ======== View Functions ========

    /// Resolve name to address
    public fun resolve_name(registry: &NameRegistry, name: String): address {
        assert!(table::contains(&registry.names, name), ENameNotFound);
        *table::borrow(&registry.names, name)
    }

    /// Get primary name for address
    public fun get_primary_name(registry: &NameRegistry, addr: address): String {
        assert!(table::contains(&registry.addresses, addr), ENameNotFound);
        *table::borrow(&registry.addresses, addr)
    }

    /// Check if name is available
    public fun is_name_available(registry: &NameRegistry, name: String): bool {
        !table::contains(&registry.names, name)
    }

    /// Get name info
    public fun get_name_info(uwu_name: &UwuName): (String, address, u64) {
        (uwu_name.name, uwu_name.owner, uwu_name.registered_at)
    }

    /// Get registry stats
    public fun get_registry_stats(registry: &NameRegistry): u64 {
        registry.total_names
    }
}
