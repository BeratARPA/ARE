namespace ARE.Core.Core
{
    /// <summary>Bir action'ın kural içindeki bağlantısı (tipi + ayarları)</summary>
    public class ActionBinding
    {
        public string ActionType { get; set; } = "";

        public ActionSettings Settings { get; set; } = new();

        public int Order { get; set; }
    }
}
