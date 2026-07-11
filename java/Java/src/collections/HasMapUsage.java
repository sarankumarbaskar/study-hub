package collections;

public class HasMapUsage {

    public static void main(String[] args) {

        HashMap<String, String> map = new HashMap<>();

        map.put(null, "hi");
        System.out.println(map.get(null));
    }
}