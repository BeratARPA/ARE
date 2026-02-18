namespace ARE.Core.Abstractions.Enums
{
    /// <summary>Koşulların nasıl eşleşeceği</summary>
    public enum MatchMode
    {
        /// <summary>Tüm koşullar doğru olmalı (AND)</summary>
        All,

        /// <summary>En az bir koşul doğru olmalı (OR)</summary>
        Any,

        /// <summary>Hiçbir koşul doğru olmamalı (NOT)</summary>
        None,

        /// <summary>Tam olarak bir koşul doğru olmalı (XOR benzeri)</summary>
        ExactlyOne
    }
}
