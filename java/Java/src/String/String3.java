package String;

public class String3 {
    public static void main(String[] args) {
        String1 str1 = new String1();
        String2 str2 = new String2();
        int i = str1.get();
        int j = str2.get();
        System.out.println(i == j);
        System.out.println(str2.equals(str1));
    }
}


class String1 {
     final java.lang.String str = "String1";

     int get(){
         return str.hashCode();
     }
}


class String2 {
    java.lang.String str = "String1";
    int get(){
        return str.hashCode();
    }
}
