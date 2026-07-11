package collections;

import java.util.Objects;

public class HashMap<K, V> {

    private static final int DEFAULT_CAPACITY = 16;
    private static final float DEFAULT_LOAD_FACTOR = 0.75f;


    Node<K, V>[] table;
    int size;
    float loadFactor;
    int threshold;
    int modCount;


    static class Node<K, V> {
        final int hash;
        final K key;
        V value;
        Node<K, V> next;

        Node(int hash, K key, V value, Node<K, V> next) {
            this.hash = hash;
            this.key = key;
            this.value = value;
            this.next = next;
        }
    }

    public HashMap() {
        table = new Node[DEFAULT_CAPACITY];
        loadFactor = DEFAULT_LOAD_FACTOR;
    }


    public void put(K key, V value) {

        int hash = (key == null) ? 0 : key.hashCode();
        int index = hash & (table.length - 1);

        if (table[index] == null) {
            table[index] = new Node<>(hash, key, value, null);
            size++;
            return;
        }

        Node<K, V> current = table[index];

        while (current != null) {

            if (current.hash == hash && Objects.equals(current.key, key)) {
                current.value = value;
                return;
            }

            if (current.next == null) {
                break;
            }

            current = current.next;
        }

        current.next = new Node<>(hash, key, value, null);
        size++;
    }

    public V get(K key) {
        int hash = (key == null) ? 0 : key.hashCode();
        int index = hash & (table.length - 1);
        if (table[index] == null) {
            return null;
        }

        Node<K, V> current = table[index];
        while(current != null) {
            if (Objects.equals(current.key, key)) {
                return current.value;
            }
            current = current.next;
        }
        return null;
    }


}
